import { UnionToIntersection } from "../union-to-intersection";
export type UnionKeys<UnionType> = keyof UnionToIntersection<UnionType extends UnionType ? Record<keyof UnionType, never> : never>;
