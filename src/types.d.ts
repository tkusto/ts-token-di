export type Token = string | symbol;

type TokenMap = {
  [key: Token]: any;
};

export type InjectArgs<M extends TokenMap, D extends (keyof M)[]> = {
  [K in (keyof D)]: D[K] extends keyof M ? M[D[K]] : never;
}

export type Union<U> = U extends infer F ? { [K in keyof F]: F[K] } : never;
