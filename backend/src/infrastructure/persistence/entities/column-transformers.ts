export const decimalColumnTransformer = {
  to(value: number | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return value.toFixed(2);
  },

  from(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }

    return typeof value === 'number' ? value : Number.parseFloat(value);
  },
};

export const nullableDecimalColumnTransformer = {
  to(value: number | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return value.toFixed(2);
  },

  from(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return typeof value === 'number' ? value : Number.parseFloat(value);
  },
};
