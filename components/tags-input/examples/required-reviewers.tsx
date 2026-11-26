import { TagsInput } from "@fndn/react";

/* max: the input stops taking tags at three */
export default function RequiredReviewers() {
  return <TagsInput label="Required reviewers, up to 3" max={3} defaultValue={["Priya Raman", "Daniel Okafor"]} placeholder="Add a reviewer" style={{ width: 320 }} />;
}
