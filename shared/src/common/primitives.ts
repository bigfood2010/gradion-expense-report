export type Uuid = string;

export type IsoDateString = string;

export type IsoDateTimeString = string;

export type CurrencyCode = string;

export interface EntityRefDto {
  id: Uuid;
}

export interface AuditedDto {
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
