import ProfileView from "./ProfileView";

export const metadata = {
  title: "Profile",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}