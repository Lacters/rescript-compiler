open Parsetree

let arrowType ?(arity = max_int) ct =
  let rec process attrsBefore acc typ arity =
    match typ with
    | typ when arity <= 0 -> (attrsBefore, List.rev acc, typ)
    | {
     ptyp_desc = Ptyp_arrow ((Nolabel as lbl), typ1, typ2);
     ptyp_attributes = [];
    } ->
      let arg = ([], lbl, typ1) in
      process attrsBefore (arg :: acc) typ2 (arity - 1)
    | {
     ptyp_desc = Ptyp_arrow (Nolabel, _typ1, _typ2);
     ptyp_attributes = [({txt = "bs"}, _)];
    } ->
      (* stop here, the uncurried attribute always indicates the beginning of an arrow function
         * e.g. `(. int) => (. int)` instead of `(. int, . int)` *)
      (attrsBefore, List.rev acc, typ)
    | {ptyp_desc = Ptyp_arrow (Nolabel, _typ1, _typ2); ptyp_attributes = _attrs}
      as returnType ->
      let args = List.rev acc in
      (attrsBefore, args, returnType)
    | {
     ptyp_desc = Ptyp_arrow (((Labelled _ | Optional _) as lbl), typ1, typ2);
     ptyp_attributes = attrs;
    } ->
      let arg = (attrs, lbl, typ1) in
      process attrsBefore (arg :: acc) typ2 (arity - 1)
    | typ -> (attrsBefore, List.rev acc, typ)
  in
  match ct with
  | {ptyp_desc = Ptyp_arrow (Nolabel, _typ1, _typ2); ptyp_attributes = attrs} as
    typ ->
    process attrs [] {typ with ptyp_attributes = []} arity
  | typ -> process [] [] typ arity

let functorType modtype =
  let rec process acc modtype =
    match modtype with
    | {
     pmty_desc = Pmty_functor (lbl, argType, returnType);
     pmty_attributes = attrs;
    } ->
      let arg = (attrs, lbl, argType) in
      process (arg :: acc) returnType
    | modType -> (List.rev acc, modType)
  in
  process [] modtype

let processBsAttribute attrs =
  let rec process bsSpotted acc attrs =
    match attrs with
    | [] -> (bsSpotted, List.rev acc)
    | ({Location.txt = "bs"}, _) :: rest -> process true acc rest
    | attr :: rest -> process bsSpotted (attr :: acc) rest
  in
  process false [] attrs

let processUncurriedAppAttribute attrs =
  let rec process uncurriedApp acc attrs =
    match attrs with
    | [] -> (uncurriedApp, List.rev acc)
    | ( {
          Location.txt =
            "bs" (* still support @bs to convert .ml files *) | "res.uapp";
        },
        _ )
      :: rest ->
      process true acc rest
    | attr :: rest -> process uncurriedApp (attr :: acc) rest
  in
  process false [] attrs

let processPartialAppAttribute attrs =
  let rec process partialApp acc attrs =
    match attrs with
    | [] -> (partialApp, List.rev acc)
    | ({Location.txt = "res.partial"}, _) :: rest -> process true acc rest
    | attr :: rest -> process partialApp (attr :: acc) rest
  in
  process false [] attrs

type functionAttributesInfo = {
  async: bool;
  bs: bool;
  attributes: Parsetree.attributes;
}

let processFunctionAttributes attrs =
  let rec process async bs acc attrs =
    match attrs with
    | [] -> {async; bs; attributes = List.rev acc}
    | ({Location.txt = "bs"}, _) :: rest -> process async true acc rest
    | ({Location.txt = "res.async"}, _) :: rest -> process true bs acc rest
    | attr :: rest -> process async bs (attr :: acc) rest
  in
  process false false [] attrs

let hasAwaitAttribute attrs =
  List.exists
    (function
      | {Location.txt = "res.await"}, _ -> true
      | _ -> false)
    attrs

let collectArrayExpressions expr =
  match expr.pexp_desc with
  | Pexp_array exprs -> (exprs, None)
  | _ -> ([], Some expr)

let collectListExpressions expr =
  let rec collect acc expr =
    match expr.pexp_desc with
    | Pexp_construct ({txt = Longident.Lident "[]"}, _) -> (List.rev acc, None)
    | Pexp_construct
        ( {txt = Longident.Lident "::"},
          Some {pexp_desc = Pexp_tuple (hd :: [tail])} ) ->
      collect (hd :: acc) tail
    | _ -> (List.rev acc, Some expr)
  in
  collect [] expr

(* (__x) => f(a, __x, c) -----> f(a, _, c)  *)
let rewriteUnderscoreApply expr =
  let expr_fun =
    if Ast_uncurried.exprIsUncurriedFun expr then
      Ast_uncurried.exprExtractUncurriedFun expr
    else expr
  in
  match expr_fun.pexp_desc with
  | Pexp_fun
      ( Nolabel,
        None,
        {ppat_desc = Ppat_var {txt = "__x"}},
        ({pexp_desc = Pexp_apply (callExpr, args)} as e) ) ->
    let newArgs =
      List.map
        (fun arg ->
          match arg with
          | ( lbl,
              ({pexp_desc = Pexp_ident ({txt = Longident.Lident "__x"} as lid)}
               as argExpr) ) ->
            ( lbl,
              {
                argExpr with
                pexp_desc = Pexp_ident {lid with txt = Longident.Lident "_"};
              } )
          | arg -> arg)
        args
    in
    {e with pexp_desc = Pexp_apply (callExpr, newArgs)}
  | _ -> expr

type funParamKind =
  | Parameter of {
      attrs: Parsetree.attributes;
      lbl: Asttypes.arg_label;
      defaultExpr: Parsetree.expression option;
      pat: Parsetree.pattern;
    }
  | NewTypes of {attrs: Parsetree.attributes; locs: string Asttypes.loc list}

let funExpr expr =
  (* Turns (type t, type u, type z) into "type t u z" *)
  let rec collectNewTypes acc returnExpr =
    match returnExpr with
    | {pexp_desc = Pexp_newtype (stringLoc, returnExpr); pexp_attributes = []}
      ->
      collectNewTypes (stringLoc :: acc) returnExpr
    | returnExpr -> (List.rev acc, returnExpr)
  in
  let rec collect ~uncurried ~nFun attrsBefore acc expr =
    match expr with
    | {
     pexp_desc =
       Pexp_fun
         ( Nolabel,
           None,
           {ppat_desc = Ppat_var {txt = "__x"}},
           {pexp_desc = Pexp_apply _} );
    } ->
      (uncurried, attrsBefore, List.rev acc, rewriteUnderscoreApply expr)
    | {pexp_desc = Pexp_newtype (stringLoc, rest); pexp_attributes = attrs} ->
      let stringLocs, returnExpr = collectNewTypes [stringLoc] rest in
      let param = NewTypes {attrs; locs = stringLocs} in
      collect ~uncurried ~nFun attrsBefore (param :: acc) returnExpr
    | {
     pexp_desc = Pexp_fun (lbl, defaultExpr, pattern, returnExpr);
     pexp_attributes = [];
    } ->
      let parameter = Parameter {attrs = []; lbl; defaultExpr; pat = pattern} in
      collect ~uncurried ~nFun:(nFun + 1) attrsBefore (parameter :: acc)
        returnExpr
    (* If a fun has an attribute, then it stops here and makes currying.
       i.e attributes outside of (...), uncurried `(.)` and `async` make currying *)
    | {pexp_desc = Pexp_fun _} -> (uncurried, attrsBefore, List.rev acc, expr)
    | expr when nFun = 0 && Ast_uncurried.exprIsUncurriedFun expr ->
      let expr = Ast_uncurried.exprExtractUncurriedFun expr in
      collect ~uncurried:true ~nFun attrsBefore acc expr
    | expr -> (uncurried, attrsBefore, List.rev acc, expr)
  in
  match expr with
  | {pexp_desc = Pexp_fun _ | Pexp_newtype _} ->
    collect ~uncurried:false ~nFun:0 expr.pexp_attributes []
      {expr with pexp_attributes = []}
  | _ when Ast_uncurried.exprIsUncurriedFun expr ->
    let expr = Ast_uncurried.exprExtractUncurriedFun expr in
    collect ~uncurried:true ~nFun:0 expr.pexp_attributes []
      {expr with pexp_attributes = []}
  | _ -> collect ~uncurried:false ~nFun:0 [] [] expr

let processBracesAttr expr =
  match expr.pexp_attributes with
  | (({txt = "res.braces" | "ns.braces"}, _) as attr) :: attrs ->
    (Some attr, {expr with pexp_attributes = attrs})
  | _ -> (None, expr)

let filterParsingAttrs attrs =
  List.filter
    (fun attr ->
      match attr with
      | ( {
            Location.txt =
              ( "bs" | "res.uapp" | "res.arity" | "res.braces" | "ns.braces"
              | "res.iflet" | "res.namedArgLoc" | "res.optional" | "res.ternary"
              | "res.async" | "res.await" | "res.template" );
          },
          _ ) ->
        false
      | _ -> true)
    attrs

let isBlockExpr expr =
  match expr.pexp_desc with
  | Pexp_letmodule _ | Pexp_letexception _ | Pexp_let _ | Pexp_open _
  | Pexp_sequence _ ->
    true
  | _ -> false

let isBracedExpr expr =
  match processBracesAttr expr with
  | Some _, _ -> true
  | _ -> false

let isMultilineText txt =
  let len = String.length txt in
  let rec check i =
    if i >= len then false
    else
      let c = String.unsafe_get txt i in
      match c with
      | '\010' | '\013' -> true
      | '\\' -> if i + 2 = len then false else check (i + 2)
      | _ -> check (i + 1)
  in
  check 0

let isHuggableExpression expr =
  match expr.pexp_desc with
  | Pexp_array _ | Pexp_tuple _
  | Pexp_constant (Pconst_string (_, Some _))
  | Pexp_construct ({txt = Longident.Lident ("::" | "[]")}, _)
  | Pexp_extension ({txt = "obj"}, _)
  | Pexp_record _ ->
    true
  | _ when isBlockExpr expr -> true
  | _ when isBracedExpr expr -> true
  | Pexp_constant (Pconst_string (txt, None)) when isMultilineText txt -> true
  | _ -> false

let isHuggableRhs expr =
  match expr.pexp_desc with
  | Pexp_array _ | Pexp_tuple _
  | Pexp_extension ({txt = "obj"}, _)
  | Pexp_record _ ->
    true
  | _ when isBracedExpr expr -> true
  | _ -> false

let isHuggablePattern pattern =
  match pattern.ppat_desc with
  | Ppat_array _ | Ppat_tuple _ | Ppat_record _ | Ppat_variant _
  | Ppat_construct _ ->
    true
  | _ -> false

let operatorPrecedence operator =
  match operator with
  | ":=" -> 1
  | "||" -> 2
  | "&&" -> 3
  | "=" | "==" | "<" | ">" | "!=" | "<>" | "!==" | "<=" | ">=" | "|>" -> 4
  | "+" | "+." | "-" | "-." | "^" -> 5
  | "*" | "*." | "/" | "/." -> 6
  | "**" -> 7
  | "#" | "##" | "|." | "|.u" -> 8
  | _ -> 0

let isUnaryOperator operator =
  match operator with
  | "~+" | "~+." | "~-" | "~-." | "not" -> true
  | _ -> false

let isUnaryExpression expr =
  match expr.pexp_desc with
  | Pexp_apply
      ( {pexp_desc = Pexp_ident {txt = Longident.Lident operator}},
        [(Nolabel, _arg)] )
    when isUnaryOperator operator ->
    true
  | _ -> false

(* TODO: tweak this to check for ghost ^ as template literal *)
let isBinaryOperator operator =
  match operator with
  | ":=" | "||" | "&&" | "=" | "==" | "<" | ">" | "!=" | "!==" | "<=" | ">="
  | "|>" | "+" | "+." | "-" | "-." | "^" | "*" | "*." | "/" | "/." | "**" | "|."
  | "|.u" | "<>" ->
    true
  | _ -> false

let isBinaryExpression expr =
  match expr.pexp_desc with
  | Pexp_apply
      ( {
          pexp_desc =
            Pexp_ident {txt = Longident.Lident operator; loc = operatorLoc};
        },
        [(Nolabel, _operand1); (Nolabel, _operand2)] )
    when isBinaryOperator operator
         && not (operatorLoc.loc_ghost && operator = "^")
         (* template literal *) ->
    true
  | _ -> false

let isEqualityOperator operator =
  match operator with
  | "=" | "==" | "<>" | "!=" -> true
  | _ -> false

let isRhsBinaryOperator operator =
  match operator with
  | "**" -> true
  | _ -> false

let flattenableOperators parentOperator childOperator =
  let precParent = operatorPrecedence parentOperator in
  let precChild = operatorPrecedence childOperator in
  if precParent == precChild then
    not (isEqualityOperator parentOperator && isEqualityOperator childOperator)
  else false

let rec hasIfLetAttribute attrs =
  match attrs with
  | [] -> false
  | ({Location.txt = "res.iflet"}, _) :: _ -> true
  | _ :: attrs -> hasIfLetAttribute attrs

let isIfLetExpr expr =
  match expr with
  | {pexp_attributes = attrs; pexp_desc = Pexp_match _}
    when hasIfLetAttribute attrs ->
    true
  | _ -> false

let rec hasOptionalAttribute attrs =
  match attrs with
  | [] -> false
  | ({Location.txt = "ns.optional" | "res.optional"}, _) :: _ -> true
  | _ :: attrs -> hasOptionalAttribute attrs

let hasAttributes attrs =
  List.exists
    (fun attr ->
      match attr with
      | ( {
            Location.txt =
              ( "bs" | "res.uapp" | "res.arity" | "res.braces" | "ns.braces"
              | "res.iflet" | "res.ternary" | "res.async" | "res.await"
              | "res.template" );
          },
          _ ) ->
        false
      (* Remove the fragile pattern warning for iflet expressions *)
      | ( {Location.txt = "warning"},
          PStr
            [
              {
                pstr_desc =
                  Pstr_eval
                    ({pexp_desc = Pexp_constant (Pconst_string ("-4", None))}, _);
              };
            ] ) ->
        not (hasIfLetAttribute attrs)
      | _ -> true)
    attrs

let isArrayAccess expr =
  match expr.pexp_desc with
  | Pexp_apply
      ( {pexp_desc = Pexp_ident {txt = Longident.Ldot (Lident "Array", "get")}},
        [(Nolabel, _parentExpr); (Nolabel, _memberExpr)] ) ->
    true
  | _ -> false

type ifConditionKind =
  | If of Parsetree.expression
  | IfLet of Parsetree.pattern * Parsetree.expression

let collectIfExpressions expr =
  let rec collect acc expr =
    let exprLoc = expr.pexp_loc in
    match expr.pexp_desc with
    | Pexp_ifthenelse (ifExpr, thenExpr, Some elseExpr) ->
      collect ((exprLoc, If ifExpr, thenExpr) :: acc) elseExpr
    | Pexp_ifthenelse (ifExpr, thenExpr, (None as elseExpr)) ->
      let ifs = List.rev ((exprLoc, If ifExpr, thenExpr) :: acc) in
      (ifs, elseExpr)
    | Pexp_match
        ( condition,
          [
            {pc_lhs = pattern; pc_guard = None; pc_rhs = thenExpr};
            {
              pc_rhs =
                {pexp_desc = Pexp_construct ({txt = Longident.Lident "()"}, _)};
            };
          ] )
      when isIfLetExpr expr ->
      let ifs =
        List.rev ((exprLoc, IfLet (pattern, condition), thenExpr) :: acc)
      in
      (ifs, None)
    | Pexp_match
        ( condition,
          [
            {pc_lhs = pattern; pc_guard = None; pc_rhs = thenExpr};
            {pc_rhs = elseExpr};
          ] )
      when isIfLetExpr expr ->
      collect ((exprLoc, IfLet (pattern, condition), thenExpr) :: acc) elseExpr
    | _ -> (List.rev acc, Some expr)
  in
  collect [] expr

let rec hasTernaryAttribute attrs =
  match attrs with
  | [] -> false
  | ({Location.txt = "res.ternary"}, _) :: _ -> true
  | _ :: attrs -> hasTernaryAttribute attrs

let isTernaryExpr expr =
  match expr with
  | {pexp_attributes = attrs; pexp_desc = Pexp_ifthenelse _}
    when hasTernaryAttribute attrs ->
    true
  | _ -> false

let collectTernaryParts expr =
  let rec collect acc expr =
    match expr with
    | {
     pexp_attributes = attrs;
     pexp_desc = Pexp_ifthenelse (condition, consequent, Some alternate);
    }
      when hasTernaryAttribute attrs ->
      collect ((condition, consequent) :: acc) alternate
    | alternate -> (List.rev acc, alternate)
  in
  collect [] expr

let parametersShouldHug parameters =
  match parameters with
  | [Parameter {attrs = []; lbl = Asttypes.Nolabel; defaultExpr = None; pat}]
    when isHuggablePattern pat ->
    true
  | _ -> false

let filterTernaryAttributes attrs =
  List.filter
    (fun attr ->
      match attr with
      | {Location.txt = "res.ternary"}, _ -> false
      | _ -> true)
    attrs

let filterFragileMatchAttributes attrs =
  List.filter
    (fun attr ->
      match attr with
      | ( {Location.txt = "warning"},
          PStr
            [
              {
                pstr_desc =
                  Pstr_eval
                    ({pexp_desc = Pexp_constant (Pconst_string ("-4", _))}, _);
              };
            ] ) ->
        false
      | _ -> true)
    attrs

let isJsxExpression expr =
  let rec loop attrs =
    match attrs with
    | [] -> false
    | ({Location.txt = "JSX"}, _) :: _ -> true
    | _ :: attrs -> loop attrs
  in
  match expr.pexp_desc with
  | Pexp_apply _ -> loop expr.Parsetree.pexp_attributes
  | _ -> false

let hasJsxAttribute attributes =
  let rec loop attrs =
    match attrs with
    | [] -> false
    | ({Location.txt = "JSX"}, _) :: _ -> true
    | _ :: attrs -> loop attrs
  in
  loop attributes

let shouldIndentBinaryExpr expr =
  let samePrecedenceSubExpression operator subExpression =
    match subExpression with
    | {
     pexp_desc =
       Pexp_apply
         ( {pexp_desc = Pexp_ident {txt = Longident.Lident subOperator}},
           [(Nolabel, _lhs); (Nolabel, _rhs)] );
    }
      when isBinaryOperator subOperator ->
      flattenableOperators operator subOperator
    | _ -> true
  in
  match expr with
  | {
   pexp_desc =
     Pexp_apply
       ( {pexp_desc = Pexp_ident {txt = Longident.Lident operator}},
         [(Nolabel, lhs); (Nolabel, _rhs)] );
  }
    when isBinaryOperator operator ->
    isEqualityOperator operator
    || (not (samePrecedenceSubExpression operator lhs))
    || operator = ":="
  | _ -> false

let shouldInlineRhsBinaryExpr rhs =
  match rhs.pexp_desc with
  | Parsetree.Pexp_constant _ | Pexp_let _ | Pexp_letmodule _
  | Pexp_letexception _ | Pexp_sequence _ | Pexp_open _ | Pexp_ifthenelse _
  | Pexp_for _ | Pexp_while _ | Pexp_try _ | Pexp_array _ | Pexp_record _ ->
    true
  | _ -> false

let isPrintableAttribute attr =
  match attr with
  | ( {
        Location.txt =
          ( "bs" | "res.uapp" | "res.arity" | "res.iflet" | "res.braces"
          | "ns.braces" | "JSX" | "res.async" | "res.await" | "res.template"
          | "res.ternary" );
      },
      _ ) ->
    false
  | _ -> true

let hasPrintableAttributes attrs = List.exists isPrintableAttribute attrs

let filterPrintableAttributes attrs = List.filter isPrintableAttribute attrs

let partitionPrintableAttributes attrs =
  List.partition isPrintableAttribute attrs

let isFunNewtype expr =
  match expr.pexp_desc with
  | Pexp_fun _ | Pexp_newtype _ -> true
  | _ -> Ast_uncurried.exprIsUncurriedFun expr

let requiresSpecialCallbackPrintingLastArg args =
  let rec loop args =
    match args with
    | [] -> false
    | [(_, expr)] when isFunNewtype expr -> true
    | (_, expr) :: _ when isFunNewtype expr -> false
    | _ :: rest -> loop rest
  in
  loop args

let requiresSpecialCallbackPrintingFirstArg args =
  let rec loop args =
    match args with
    | [] -> true
    | (_, expr) :: _ when isFunNewtype expr -> false
    | _ :: rest -> loop rest
  in
  match args with
  | [(_, expr)] when isFunNewtype expr -> false
  | (_, expr) :: rest when isFunNewtype expr -> loop rest
  | _ -> false

let modExprApply modExpr =
  let rec loop acc modExpr =
    match modExpr with
    | {pmod_desc = Pmod_apply (next, arg)} -> loop (arg :: acc) next
    | _ -> (acc, modExpr)
  in
  loop [] modExpr

let modExprFunctor modExpr =
  let rec loop acc modExpr =
    match modExpr with
    | {
     pmod_desc = Pmod_functor (lbl, modType, returnModExpr);
     pmod_attributes = attrs;
    } ->
      let param = (attrs, lbl, modType) in
      loop (param :: acc) returnModExpr
    | returnModExpr -> (List.rev acc, returnModExpr)
  in
  loop [] modExpr

let rec collectPatternsFromListConstruct acc pattern =
  let open Parsetree in
  match pattern.ppat_desc with
  | Ppat_construct
      ({txt = Longident.Lident "::"}, Some {ppat_desc = Ppat_tuple [pat; rest]})
    ->
    collectPatternsFromListConstruct (pat :: acc) rest
  | _ -> (List.rev acc, pattern)

let hasTemplateLiteralAttr attrs =
  List.exists
    (fun attr ->
      match attr with
      | {Location.txt = "res.template"}, _ -> true
      | _ -> false)
    attrs

let hasTaggedTemplateLiteralAttr attrs =
  List.exists
    (fun attr ->
      match attr with
      | {Location.txt = "res.taggedTemplate"}, _ -> true
      | _ -> false)
    attrs

let isTemplateLiteral expr =
  match expr.pexp_desc with
  | Pexp_apply
      ( {pexp_desc = Pexp_ident {txt = Longident.Lident "^"}},
        [(Nolabel, _); (Nolabel, _)] )
    when hasTemplateLiteralAttr expr.pexp_attributes ->
    true
  | Pexp_constant (Pconst_string (_, Some "")) -> true
  | Pexp_constant _ when hasTemplateLiteralAttr expr.pexp_attributes -> true
  | _ -> false

let isTaggedTemplateLiteral expr =
  match expr with
  | {pexp_desc = Pexp_apply _; pexp_attributes = attrs} ->
    hasTaggedTemplateLiteralAttr attrs
  | _ -> false

let hasSpreadAttr attrs =
  List.exists
    (fun attr ->
      match attr with
      | {Location.txt = "res.spread"}, _ -> true
      | _ -> false)
    attrs

let isSpreadBeltListConcat expr =
  match expr.pexp_desc with
  | Pexp_ident
      {
        txt =
          Longident.Ldot
            (Longident.Ldot (Longident.Lident "Belt", "List"), "concatMany");
      } ->
    hasSpreadAttr expr.pexp_attributes
  | _ -> false

let isSpreadBeltArrayConcat expr =
  match expr.pexp_desc with
  | Pexp_ident
      {
        txt =
          Longident.Ldot
            (Longident.Ldot (Longident.Lident "Belt", "Array"), "concatMany");
      } ->
    hasSpreadAttr expr.pexp_attributes
  | _ -> false

(* Blue | Red | Green -> [Blue; Red; Green] *)
let collectOrPatternChain pat =
  let rec loop pattern chain =
    match pattern.ppat_desc with
    | Ppat_or (left, right) -> loop left (right :: chain)
    | _ -> pattern :: chain
  in
  loop pat []

let isSinglePipeExpr expr =
  (* handles:
   *   x
   *   ->Js.Dict.get("wm-property")
   *   ->Option.flatMap(Js.Json.decodeString)
   *   ->Option.flatMap(x =>
   *     switch x {
   *     | "like-of" => Some(#like)
   *     | "repost-of" => Some(#repost)
   *     | _ => None
   *     }
   *   )
   *)
  let isPipeExpr expr =
    match expr.pexp_desc with
    | Pexp_apply
        ( {pexp_desc = Pexp_ident {txt = Longident.Lident ("|." | "|.u" | "|>")}},
          [(Nolabel, _operand1); (Nolabel, _operand2)] ) ->
      true
    | _ -> false
  in
  match expr.pexp_desc with
  | Pexp_apply
      ( {pexp_desc = Pexp_ident {txt = Longident.Lident ("|." | "|.u" | "|>")}},
        [(Nolabel, operand1); (Nolabel, _operand2)] )
    when not (isPipeExpr operand1) ->
    true
  | _ -> false

let isUnderscoreApplySugar expr =
  match expr.pexp_desc with
  | Pexp_fun
      ( Nolabel,
        None,
        {ppat_desc = Ppat_var {txt = "__x"}},
        {pexp_desc = Pexp_apply _} ) ->
    true
  | _ -> false

let isRewrittenUnderscoreApplySugar expr =
  match expr.pexp_desc with
  | Pexp_ident {txt = Longident.Lident "_"} -> true
  | _ -> false
