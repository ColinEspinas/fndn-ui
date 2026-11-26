import { useEffect, useState, type CSSProperties, type HTMLAttributes } from "react";
import { initialsOf, maxInitials } from "./avatar.logic";
import { avatar } from "./avatar.recipe";

export type AvatarSize = 12 | 14 | 16 | 20 | 24 | 28 | 32 | 40 | "12" | "14" | "16" | "20" | "24" | "28" | "32" | "40";
export type AvatarShape = "round" | "square";
export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "color"> & {
  /** Accessible name; the initials come from it unless `initials` is given. */
  name?: string;
  initials?: string;
  /** Image URL; the initials show until it loads and if it fails. */
  src?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Fill behind the initials (any CSS colour); default ink-3. */
  color?: string;
};

/** Image or initials, 12–20px in text, 24–40px in rows and headers. */
export function Avatar({ name, initials, src, size = 16, shape = "round", color, className, style, ...rest }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const letters = initials ?? initialsOf(name, maxInitials(size));
  const showImage = !!src && !failed;
  const r = avatar({ size: String(size) as `${Exclude<AvatarSize, string>}`, shape, image: showImage });
  return (
    <span
      data-slot="avatar"
      className={r.base({ class: className })}
      role={name ? "img" : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : "true"}
      style={color ? ({ ...style, "--fndn-avatar-color": color } as CSSProperties) : style}
      {...rest}
    >
      <span data-slot="avatar-initials" className={r.initials()} aria-hidden="true">{letters}</span>
      {showImage && <img data-slot="avatar-image" className={r.image()} src={src} alt="" onError={() => setFailed(true)} />}
    </span>
  );
}
