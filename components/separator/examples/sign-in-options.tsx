import { Button, Separator } from "@fndn/react";

export default function SignInOptions() {
  return (
    <div className="flex w-72 flex-col gap-3">
      <Button variant="primary">Continue with email</Button>
      <Separator>or</Separator>
      <Button>Continue with single sign-on</Button>
    </div>
  );
}
