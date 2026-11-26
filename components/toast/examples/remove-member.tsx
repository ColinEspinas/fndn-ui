import { Button, Toast, toast } from "@fndn/react";

export default function RemoveMember() {
  const remove = () => {
    toast({ title: "Lucas Moreau was removed from Northwind", action: { label: "Undo", onClick: () => toast({ title: "Lucas Moreau is back in Northwind", tone: "green" }) } });
  };
  return (
    <>
      <Button variant="danger" onClick={remove}>Remove Lucas Moreau</Button>
      {/* mount the region once, near the root of the app */}
      <Toast />
    </>
  );
}
