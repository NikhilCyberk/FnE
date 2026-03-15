import { useState, useEffect, useCallback } from 'react';

export const useForm = (initialState) => {
  const [form, setForm] = useState(initialState);

  const set = useCallback((field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  }, []);

  const reset = useCallback(() => setForm(initialState), [initialState]);
  const updateForm = useCallback((newState) => setForm((f) => ({ ...f, ...newState })), []);

  return { form, set, setForm, reset, updateForm };
};

export const useAsyncState = (initialValue) => {
  const [state, setState] = useState({
    data: initialValue,
    loading: false,
    error: null
  });

  const setLoading = useCallback((loading) => 
    setState(prev => ({ ...prev, loading })), []);

  const setError = useCallback((error) => 
    setState(prev => ({ ...prev, error, loading: false })), []);

  const setData = useCallback((data) => 
    setState(prev => ({ ...prev, data, error: null, loading: false })), []);

  const execute = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [setLoading, setError, setData]);

  return { ...state, setLoading, setError, setData, execute };
};

export const useDialog = (initialState = false) => {
  const [open, setOpen] = useState(initialState);

  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);
  const toggleDialog = useCallback(() => setOpen(prev => !prev), []);

  return { open, openDialog, closeDialog, toggleDialog };
};

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage(prev => prev + 1), []);
  const prevPage = useCallback(() => setPage(prev => Math.max(1, prev - 1)), []);
  const goToPage = useCallback((newPage) => setPage(Math.max(1, newPage)), []);

  return { page, limit, setPage, setLimit, nextPage, prevPage, goToPage };
};
