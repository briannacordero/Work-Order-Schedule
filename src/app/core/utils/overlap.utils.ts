export function rangesOverlapInclusive(aStartIso: string, aEndIso: string, bStartIso: string, bEndIso: string): boolean {
    const aStart = startOfDay(new Date(aStartIso));
    const aEndExclusive = addDays(startOfDay(new Date(aEndIso)), 1);
  
    const bStart = startOfDay(new Date(bStartIso));
    const bEndExclusive = addDays(startOfDay(new Date(bEndIso)), 1);
  
    return Math.max(aStart.getTime(), bStart.getTime()) < Math.min(aEndExclusive.getTime(), bEndExclusive.getTime());
  }
  
  function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  
  function addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }
  