import { Steps, type StepsItem } from "@fndn/react";

const items: StepsItem[] = [
  { title: "Repository", description: "From GitHub", content: "northwind/web-app, 1,284 commits on main." },
  { title: "Configure", description: "Build and env", content: "Next.js detected. Build with pnpm build, output .next." },
  { title: "Deploy", description: "Production", content: "The first deploy builds main and gives it a URL." },
];

export default function CreateProject() {
  return (
    <Steps
      className="w-80"
      defaultStep={1}
      controls
      nextLabel="Continue"
      completed="web-app is live on Production."
      items={items}
    />
  );
}
