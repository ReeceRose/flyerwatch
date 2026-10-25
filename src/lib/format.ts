import * as shared from "@/shared/format";

export const tidyName: (name: string) => string = shared.tidyName;
export const formatDay: (iso: string | null) => string | null = shared.formatDay;
export const formatRange: (from: string, to: string) => string = shared.formatRange;
export const formatPostal: (code: string) => string = shared.formatPostal;
