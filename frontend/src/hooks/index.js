import { useState, useEffect } from 'react';

export const useForm = (initialState) => {
  const [form, setForm] = useState(initialState);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const reset = () => setForm(initialState);
  const updateForm = (newState) => setForm((f) => ({ ...f, ...newState }));

  return { form, set, setForm, reset, updateForm };
};

export const useAsyncState = (initialValue) => {
  const [state, setState] = useState({
    data: initialValue,
    loading: false,
    error: null
  });

  const setLoading = (loading) => setState(prev => ({ ...prev, loading }));
  const setError = (error) => setState(prev => ({ ...prev, error, loading: false }));
  const setData = (data) => setState(prev => ({ ...prev, data, error: null, loading: false }));

  const execute = async (asyncFn) => {
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
  };

  return { ...state, setLoading, setError, setData, execute };
};

export const useDialog = (initialState = false) => {
  const [open, setOpen] = useState(initialState);

  const openDialog = () => setOpen(true);
  const closeDialog = () => setOpen(false);
  const toggleDialog = () => setOpen(prev => !prev);

  return { open, openDialog, closeDialog, toggleDialog };
};

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = () => setPage(prev => prev + 1);
  const prevPage = () => setPage(prev => Math.max(1, prev - 1));
  const goToPage = (newPage) => setPage(Math.max(1, newPage));

  return { page, limit, setPage, setLimit, nextPage, prevPage, goToPage };
};
