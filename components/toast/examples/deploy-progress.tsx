import { Button, Toast, toast } from "@fndn/react";

export default function DeployProgress() {
  const deploy = () => {
    const id = toast({ title: "Deploying web-app to Production…", loading: true, closable: false });
    setTimeout(() => toast.update(id, { title: "Deployed to Production", description: "dpl_7f3a9c is live at app.northwind.example.", tone: "green", loading: false, duration: 4000, closable: true }), 2000);
  };
  return (
    <>
      <Button variant="primary" onClick={deploy}>Deploy to Production</Button>
      {/* mount the region once, near the root of the app */}
      <Toast />
    </>
  );
}
