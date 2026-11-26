import { Link } from "@phosphor-icons/react";
import { Button, Toast, toast } from "@fndn/react";

export default function CopyInviteLink() {
  const copy = () => {
    void navigator.clipboard.writeText("https://northwind.example/join/8f2k1q");
    toast({ title: "Invite link copied", description: "Anyone with the link can join Northwind until Nov 24.", tone: "green" });
  };
  return (
    <>
      <Button icon={<Link data-slot="icon" weight="bold" />} onClick={copy}>Copy invite link</Button>
      {/* mount the region once, near the root of the app */}
      <Toast />
    </>
  );
}
