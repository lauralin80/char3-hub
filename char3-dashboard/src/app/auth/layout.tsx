export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't use the AppLayout (no sidebar)
  return <>{children}</>;
}

