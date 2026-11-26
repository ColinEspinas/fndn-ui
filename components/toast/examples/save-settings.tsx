import { Button, Toast, toast } from "@fndn/react";

export default function SaveSettings() {
  const save = () => {
    toast({ title: "Changes saved", description: "web-app now builds with pnpm build." });
  };
  return (
    <>
      <Button onClick={save}>Save changes</Button>
      {/* mount the region once, near the root of the app */}
      <Toast />
    </>
  );
}
