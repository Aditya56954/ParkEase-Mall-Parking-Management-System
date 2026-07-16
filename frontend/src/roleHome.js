export function roleHome(role) {
  switch (role) {
    case 'user':
      return '/park';
    case 'guard':
      return '/gate';
    case 'mallOwner':
      return '/owner';
    case 'admin':
      return '/admin';
    default:
      return '/login';
  }
}
