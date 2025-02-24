import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, MenuItem } from "@mui/material";
import { useFetchClasses, useUpdateClass } from "../queries/classQueries";
import { useFetchContacts } from "../queries/contactQueries";
import { useFetchStores } from "../queries/storeQueries";
import { useFetchOperators } from "../queries/operatorQueries";

const EditClass: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: classes } = useFetchClasses();
  const { data: contacts } = useFetchContacts();
  const { data: stores } = useFetchStores();
  const { data: operators } = useFetchOperators();
  console.log("operators", operators);
  const updateClassMutation = useUpdateClass();

  const [classData, setClassData] = useState({
    name: "",
    address: "",
    uniqueSymbol: "",
    monthlyBudget: 0,
    gender: "בנים" as "בנים" | "בנות",
    contactId: "",
    description: "",
    chosenStore: "",
    educationType: "",
    afternoonOpenDate: "",
    regularOperatorId: "",
  });

  useEffect(() => {
    if (classes) {
      const classToEdit = classes.find((c: any) => c._id === id);
      if (classToEdit) {
        setClassData(classToEdit);
      }
    }
  }, [classes, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClassData((prevState) => ({
      ...prevState,
      [name]: name === "gender" ? (value as "בנים" | "בנות") : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      console.error("Missing class ID");
      return;
    }
    updateClassMutation.mutate({ id, updatedClass: classData });
    navigate("/classes");
  };

  return (
    <Box sx={{ width: "50%", mx: "auto", mt: 4 }}>
      <Typography variant="h4" textAlign="center">
        עריכת כיתה
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField fullWidth margin="normal" label="שם" name="name" value={classData.name} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="כתובת" name="address" value={classData.address} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="סמל קבוצה" name="uniqueSymbol" value={classData.uniqueSymbol} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="תקציב חודשי" name="monthlyBudget" type="number" value={classData.monthlyBudget} onChange={handleChange} />
        <TextField select fullWidth margin="normal" label="מגדר" name="gender" value={classData.gender} onChange={handleChange}>
          <MenuItem value="בנים">בנים</MenuItem>
          <MenuItem value="בנות">בנות</MenuItem>
        </TextField>
        <TextField fullWidth margin="normal" label="תיאור" name="description" value={classData.description} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="תאריך פתיחת צהרון" name="afternoonOpenDate" type="date" value={classData.afternoonOpenDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
        <TextField select fullWidth margin="normal" label="איש קשר" name="contactId" value={classData.contactId} onChange={handleChange}>
          {contacts?.map((contact: any) => (
            <MenuItem key={contact._id} value={contact._id}>{contact.name}</MenuItem>
          ))}
        </TextField>
        <TextField select fullWidth margin="normal" label="חנות נבחרת לרכש" name="chosenStore" value={classData.chosenStore} onChange={handleChange}>
          {stores?.map((store: any) => (
            <MenuItem key={store._id} value={store._id}>{store.name}</MenuItem>
          ))}
        </TextField>
        <TextField select fullWidth margin="normal" label="מפעיל קבוע" name="regularOperatorId" value={classData.regularOperatorId} onChange={handleChange}>
          {operators?.map((operator: any) => (
            <MenuItem key={operator._id} value={operator._id}>{operator.firstName} {operator.lastName}</MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" color="primary" fullWidth>
          שמירה
        </Button>
      </form>
    </Box>
  );
};

export default EditClass;
