import { tv, type VariantProps } from "../lib/tv";

/* alert-dialog — the Dialog with role="alertdialog": no close button, Cancel and the action in
 * the footer. Everything that shows (window, backdrop, motion, stacking, the phone layout where
 * the two actions share the row) is the dialog recipe's, through the real Dialog. What is left
 * here is the hook around it; the two Buttons are marked data-alert-dialog="cancel|action" and
 * take nothing of their own. */

export const alertDialog = tv({
  slots: {
    base: "contents",
    cancel: "",
    action: "",
  },
});

export type AlertDialogRecipeProps = VariantProps<typeof alertDialog>;
