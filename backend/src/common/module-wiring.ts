import type { DynamicModule, ForwardReference, Provider, Type } from '@nestjs/common';

export type FeatureModuleImport =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference;

export const featureModuleImports: FeatureModuleImport[] = [];
export const featureModuleProviders: Provider[] = [];
