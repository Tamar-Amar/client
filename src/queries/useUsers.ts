import { useQuery } from "@tanstack/react-query";

const fetchAllUsers = async () => {
  const response = await fetch(process.env.REACT_APP_API_URL + '/api/users', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.json();
};

export const useFetchAllUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchAllUsers(),
  });
};

