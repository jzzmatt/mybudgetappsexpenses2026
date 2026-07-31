import { currentUser } from "@clerk/nextjs/server";
import { LogoutButton } from "@/components/layout/logout-button";

export async function AppSidebarUser() {
  const user = await currentUser();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "User";
  const initials = fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-sidebar-user">
      <span aria-hidden="true" className="app-sidebar-avatar">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="app-sidebar-avatar-image" src={user.imageUrl} />
        ) : (
          initials
        )}
      </span>
      <div className="app-sidebar-user-copy">
        <p className="app-sidebar-user-name">{fullName}</p>
        <p className="app-sidebar-user-role">Administrator</p>
      </div>
      <LogoutButton variant="sidebar" />
    </div>
  );
}
