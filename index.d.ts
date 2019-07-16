declare module 'mongoose-hidden' {
  const fn: (options?: any) => (schema: any, options?: any) => void;
  export = fn;
}
  