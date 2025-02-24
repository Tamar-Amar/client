import React from "react";
import { useFetchContacts, useDeleteContact } from "../queries/contactQueries";
import { Box, Button, Typography } from "@mui/material";
import { Contact } from "../types";

const ContactList: React.FC = () => {
  const { data: contacts, isLoading, isError } = useFetchContacts();
  const deleteMutation = useDeleteContact();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading contacts.</div>;

  return (
    <Box sx={{ width: "80%", mx: "auto", mt: 4 }}>
      <Typography variant="h4" textAlign="center">רשימת אנשי קשר</Typography>
      {contacts.map((contact: Contact) => (
        <Box key={contact._id} sx={{ display: "flex", justifyContent: "space-between", mt: 2, p: 2, border: "1px solid gray" }}>
          <Typography>{contact.name} - {contact.phone} ({contact.email})</Typography>
          <Button variant="outlined" color="secondary" onClick={() => deleteMutation.mutate(contact._id!)}>
            מחיקה
          </Button>
        </Box>
      ))}
    </Box>
  );
};

export default ContactList;
