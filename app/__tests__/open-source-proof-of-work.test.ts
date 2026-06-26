import {
  getEffectiveProofOfCompletionFields,
  isProofOfWorkComplete,
} from "@/app/dashboard/lib/open-source-proof-of-work";
import type { OpenSourceEntry } from "@/app/dashboard/components/types";

const PR_FIELD = { type: "URL", text: "Pull request link: " };
const FEEDBACK_CHECKBOX = {
  type: "Checkbox",
  text: "Did you receive (and act on) one point of critical feedback on this issue?",
};
const FEEDBACK_TEXT = {
  type: "text",
  text: "Write a 1 sentence summary of the feedback you received and the action you took to address it.",
};

const partnershipCriteria = [
  {
    type: "issue",
    proof_of_completion: [PR_FIELD],
  },
  {
    type: "receive_feedback",
    proof_of_completion: [FEEDBACK_CHECKBOX, FEEDBACK_TEXT],
  },
  {
    type: "closer",
    proof_of_completion: [{ type: "checkbox", text: "Did you solve the issue within 3 months?" }],
  },
];

function makeIssueEntry(
  overrides: Partial<OpenSourceEntry> = {}
): OpenSourceEntry {
  return {
    id: 1,
    partnershipName: "Test Partner",
    criteriaType: "issue",
    status: "inProgress",
    proofOfCompletion: [PR_FIELD],
    proofResponses: {},
    userId: "user-1",
    ...overrides,
  };
}

describe("getEffectiveProofOfCompletionFields", () => {
  it("returns only primary proof fields when issue has no extras", () => {
    const fields = getEffectiveProofOfCompletionFields(
      makeIssueEntry({ selectedExtras: [] }),
      partnershipCriteria
    );
    expect(fields).toEqual([PR_FIELD]);
  });

  it("merges extra proof fields when issue has selected extras", () => {
    const fields = getEffectiveProofOfCompletionFields(
      makeIssueEntry({ selectedExtras: ["receive_feedback"] }),
      partnershipCriteria
    );
    expect(fields).toEqual([PR_FIELD, FEEDBACK_CHECKBOX, FEEDBACK_TEXT]);
  });

  it("ignores extras without proof_of_completion definitions", () => {
    const fields = getEffectiveProofOfCompletionFields(
      makeIssueEntry({ selectedExtras: ["unknown_extra"] }),
      partnershipCriteria
    );
    expect(fields).toEqual([PR_FIELD]);
  });
});

describe("isProofOfWorkComplete", () => {
  it("allows done when issue has no extras and PR link is filled", () => {
    expect(
      isProofOfWorkComplete(
        makeIssueEntry({
          proofResponses: { "Pull request link: ": "https://github.com/org/repo/pull/1" },
        }),
        partnershipCriteria
      )
    ).toBe(true);
  });

  it("blocks done when issue has no extras and PR link is missing", () => {
    expect(isProofOfWorkComplete(makeIssueEntry(), partnershipCriteria)).toBe(false);
  });

  it("blocks done when extras exist but extra proof fields are incomplete", () => {
    expect(
      isProofOfWorkComplete(
        makeIssueEntry({
          selectedExtras: ["receive_feedback"],
          proofResponses: {
            "Pull request link: ": "https://github.com/org/repo/pull/1",
          },
        }),
        partnershipCriteria
      )
    ).toBe(false);
  });

  it("allows done when extras exist and all proof fields are complete", () => {
    expect(
      isProofOfWorkComplete(
        makeIssueEntry({
          selectedExtras: ["receive_feedback", "closer"],
          proofResponses: {
            "Pull request link: ": "https://github.com/org/repo/pull/1",
            [FEEDBACK_CHECKBOX.text]: true,
            [FEEDBACK_TEXT.text]: "Addressed review comment about error handling.",
            "Did you solve the issue within 3 months?": true,
          },
        }),
        partnershipCriteria
      )
    ).toBe(true);
  });

  it("returns true when there are no proof fields defined", () => {
    expect(
      isProofOfWorkComplete(
        makeIssueEntry({ proofOfCompletion: [], selectedExtras: [] }),
        partnershipCriteria
      )
    ).toBe(true);
  });
});
