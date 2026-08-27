export function ClerkUnavailableNotice({ message }: { message: string }) {
  return (
    <p className="form-error auth-config-notice" role="alert">
      {message}
    </p>
  );
}
