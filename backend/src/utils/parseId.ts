export const parseId = (param: string): number | null => {
  const id = parseInt(param, 10);
  return isNaN(id) ? null : id;
};