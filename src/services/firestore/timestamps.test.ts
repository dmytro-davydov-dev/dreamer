import { Timestamp } from "firebase/firestore";

import { nowTs } from "./timestamps";

describe("services/firestore/timestamps", () => {
  it("delegates to Timestamp.now", () => {
    const expected = { seconds: 123, nanoseconds: 0 } as unknown as Timestamp;
    const spy = jest.spyOn(Timestamp, "now").mockReturnValue(expected);

    const value = nowTs();

    expect(value).toBe(expected);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
