export const extractJSONfromNote = <T = Record<string, unknown>>(
  note: string,
  incomeJson?: T,
): T => {
  let buffer = note;
  let json = incomeJson || ({} as T);

  const jsonStartIndex = buffer.indexOf('```json');

  if (jsonStartIndex === -1) return json;

  //   +8 we need exclude "```json\n" from new sub string;
  buffer = buffer.substring(jsonStartIndex + 8, buffer.length);

  const jsonEndIndex = buffer.indexOf('```');
  const jsonStr = buffer.substring(0, jsonEndIndex);
  buffer = buffer.substring(jsonEndIndex + 4, buffer.length);

  const obj = JSON.parse(jsonStr);

  json = {
    ...json,
    ...obj,
  };

  return extractJSONfromNote(buffer, json);
};
