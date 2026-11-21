import type { IsNever } from "../is-never";
export type IsTuple<Type> = Type extends ReadonlyArray<infer Values> ? Array<Values> extends Type ? IsNever<keyof Type & `${number}`> extends true ? never : Type : Type : never;
