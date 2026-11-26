import { Carousel } from "@fndn/react";

const tips = [
  "Press ⌘K to search projects, people and deploys.",
  "Type # in a comment to link a pull request.",
  "Hold Shift with an arrow key to resize a panel by 10%.",
];

export default function Tips() {
  return <Carousel className="w-full max-w-sm" label="Tips" loop="rewind" items={tips} />;
}
