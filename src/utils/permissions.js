export function hasRole(account, role) {
  return Boolean(account && account.role === role);
}
