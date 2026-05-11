export function getApiErrorStatus(error) {
  return error?.response?.status ?? (error?.request ? 0 : null);
}

export function isUpgradeRequired(error) {
  return Boolean(error?.response?.data?.upgradeRequired);
}

export function getApiErrorState(error) {
  if (isUpgradeRequired(error)) {
    return { kind: 'upgrade', message: 'This feature requires a membership.' };
  }

  const status = getApiErrorStatus(error);
  if (status === 403) return { kind: 'forbidden', message: "You don't have permission to view this" };
  if (status === 404) return { kind: 'notFound', message: 'Content not found' };
  if (status === 0 || status >= 500) {
    return { kind: 'retryable', message: 'Something went wrong — please try again' };
  }

  return {
    kind: 'generic',
    message:
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Something went wrong — please try again',
  };
}
