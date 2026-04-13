import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Timestamp } from "firebase/firestore";

import HypothesisCard from "./HypothesisCard";
import type { HypothesisDoc, HypothesisId } from "../../../shared/types/domain";

const buildHypothesis = (): { id: HypothesisId; data: HypothesisDoc } => ({
  id: "hyp-1",
  data: {
    lens: "shadow",
    hypothesisText: "Could be that this dream shows an unacknowledged fear around conflict.",
    evidence: [
      { type: "element", refId: "element-1", quote: "A locked basement door" },
      { type: "association", refId: "assoc-1", quote: "I feel tense when I think about my manager" },
    ],
    reflectiveQuestion: "Where in waking life do you avoid this feeling?",
    createdAt: Timestamp.fromMillis(1710000000000),
  },
});

describe("HypothesisCard", () => {
  it("renders lens badge and collapsible content", async () => {
    const user = userEvent.setup();
    const hypothesis = buildHypothesis();

    render(<HypothesisCard hypothesis={hypothesis} />);

    expect(screen.getByText("Shadow")).toBeInTheDocument();
    expect(screen.getByText(/Reflective Question/i)).not.toBeVisible();

    await user.click(screen.getByText(hypothesis.data.hypothesisText));

    expect(screen.getByText(/Reflective Question/i)).toBeVisible();
    expect(screen.getByText(/Evidence References/i)).toBeInTheDocument();
    expect(screen.getByText(/Element - element-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Association - assoc-1/i)).toBeInTheDocument();
  });

  it("calls onFeedback with resonates and does_not_fit", async () => {
    const user = userEvent.setup();
    const onFeedback = jest.fn();

    render(<HypothesisCard hypothesis={buildHypothesis()} onFeedback={onFeedback} />);

    await user.click(screen.getByText(/Could be that this dream shows/i));
    await user.click(screen.getByRole("button", { name: /resonates/i }));
    await user.click(screen.getByRole("button", { name: /doesn't fit/i }));

    expect(onFeedback).toHaveBeenNthCalledWith(1, "hyp-1", "resonates");
    expect(onFeedback).toHaveBeenNthCalledWith(2, "hyp-1", "does_not_fit");
  });
});
