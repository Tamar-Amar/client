import React, { useState, useMemo } from "react";
import { Box, Button, IconButton, TextField, Typography, Menu, MenuItem } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useFetchClasses, useDeleteClass, useUpdateClass } from "../../queries/classQueries";
import { useFetchInstitutions } from "../../queries/institutionQueries";
import { useFetchContacts } from "../../queries/contactQueries";
import { useFetchOperators, useUpdateOperator } from "../../queries/operatorQueries";
import { useFetchStores, useUpdateStore } from "../../queries/storeQueries";
import { Contact, Institution, Operator } from "../../types";
import AssignDialog from "../other/AssignDialog";
import EditClassDialog from "./EditClassDialog";
import AddClassDialog from "./AddClassDialog";

const ClassList: React.FC = () => {
  const { data: classes, isLoading, isError } = useFetchClasses();
  const { data: institutions } = useFetchInstitutions();
  const { data: contacts } = useFetchContacts();
  const { data: operators } = useFetchOperators();
  const { data: stores } = useFetchStores();
  const deleteMutation = useDeleteClass();
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [editClassData, setEditClassData] = useState<any | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const updateClassMutation = useUpdateClass();
  const updateOperatorMutation = useUpdateOperator();
  const updateStoreMutation = useUpdateStore();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignDialogType, setAssignDialogType] = useState<"assignContact" | "assignInstitution" | "assignOperator" | "assignStore" | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenActions = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseActions = () => {
    setAnchorEl(null);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} classes?`)) {
      selectedRows.forEach((id) => deleteMutation.mutate(id));
      setSelectedRows([]);
    }
    handleCloseActions();
  };

  const handleOpenDialog = (type: "assignContact" | "assignInstitution" | "assignOperator" | "assignStore") => {
    setAssignDialogType(type);
    setAssignDialogOpen(true);
  };

  const handleSubmitDialog = async () => {
    if (!selectedItem || !assignDialogType) return;
    const fieldToUpdate =
      assignDialogType === "assignContact" ? "contactsId" :
      assignDialogType === "assignInstitution" ? "institutionId" :
      assignDialogType === "assignOperator" ? "operatorId" :
      assignDialogType === "assignStore" ? "chosenStore" :
      null;
    if (!fieldToUpdate) return;
    selectedRows.forEach((id) => {
      updateClassMutation.mutate({ id, updatedClass: { [fieldToUpdate]: selectedItem } });
    });
    if (assignDialogType === "assignStore") {
      updateStoreMutation.mutate({ id: selectedItem, updatedStore: { regularClasses: selectedRows } });
    }
    else if (assignDialogType === "assignOperator") {
      updateOperatorMutation.mutate({ id: selectedItem, updatedOperator: { $addToSet: { regularClasses: { $each: selectedRows } } } });
    }
    setAssignDialogOpen(false);
    setAssignDialogType(null);
    setSelectedItem("");
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "institutionId",
      headerName: "קוד מוסד",
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const institution = institutions?.find((inst: Institution) => inst._id === params.value);
        return institution ? institution.institutionCode : "N/A";
      },
    },
    { field: "uniqueSymbol", headerName: "סמל קבוצה", width: 120 },
    { field: "name", headerName: "שם", flex: 1, minWidth: 150 },
    { field: "address", headerName: "כתובת", flex: 1, minWidth: 150 },
    { field: "type", headerName: "סוג קבוצה", width: 120 },
    { field: "monthlyBudget", headerName: "תקציב חודשי", width: 120 },
    {
      field: "chosenStore",
      headerName: "חנות ניצול",
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const store = stores?.find((s) => s._id === params.value);
        return store ? store.name : "N/A";
      },
    },
    {
      field: "contactsId",
      headerName: "איש קשר",
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const contactNames = Array.isArray(params.value)
          ? params.value.map((contactId: string) => {
            const contact = contacts?.find((c: Contact) => c._id === contactId);
            return contact ? contact.name : null;
          }).filter(Boolean).join(", ")
          : "N/A";
        return contactNames;
      },
    },
    { field: "gender", headerName: "בנים או בנות", width: 120 },
    {
      field: "isSpecialEducation",
      headerName: "חינוך מיוחד",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (params.value ? "כן" : "לא"),
    },
    {
      field: "actions",
      headerName: "פעולות",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton color="primary" onClick={() => setEditClassData(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="secondary" onClick={() => handleDelete(params.row._id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ], [institutions, contacts, stores]);

  if (isLoading) return <Typography>Loading...</Typography>;
  if (isError) return <Typography color="error">Error loading classes.</Typography>;

  return (
    <Box sx={{ width: "90%", maxWidth: "1400px", mx: "auto", mt: 4 }}>
      <Typography variant="h4" mb={2} textAlign="center">רשימת קבוצות</Typography>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField label="חיפוש מהיר" variant="outlined" value={searchText} onChange={(e) => setSearchText(e.target.value)} sx={{ width: 300 }} />
        <Box display="flex" gap={2}>
          {selectedRows.length > 0 && (
            <>
              <Button variant="contained" color="secondary" onClick={handleOpenActions} startIcon={<MoreVertIcon />}>פעולות על קבוצות</Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseActions}>
                <MenuItem onClick={handleBulkDelete}>🗑️ מחיקה</MenuItem>
                <MenuItem onClick={() => handleOpenDialog("assignContact")}>👤 שיוך איש קשר</MenuItem>
                <MenuItem onClick={() => handleOpenDialog("assignInstitution")}>🏫 שיוך מוסד</MenuItem>
                <MenuItem onClick={() => handleOpenDialog("assignOperator")}>🛠️ שיוך מפעיל קבוע</MenuItem>
                <MenuItem onClick={() => handleOpenDialog("assignStore")}>🛒 שיוך חנות רכש</MenuItem>
              </Menu>
            </>
          )}
          <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)}>הוסף קבוצה חדשה</Button>
        </Box>
      </Box>

      <DataGrid
        rows={classes || []}
        columns={columns}
        pageSizeOptions={[10, 20, 50]}
        paginationMode="client"
        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        checkboxSelection
        getRowId={(row: { _id: string }) => row._id}
        onRowSelectionModelChange={(rowSelectionModel) => setSelectedRows(rowSelectionModel.map(id => String(id)))}
        autoHeight
      />

      <AssignDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        title={
          assignDialogType === "assignContact" ? "איש קשר" :
          assignDialogType === "assignInstitution" ? "מוסד" :
          assignDialogType === "assignOperator" ? "מפעיל קבוע" :
          assignDialogType === "assignStore" ? "חנות רכש" : ""
        }
        items={
          assignDialogType === "assignContact" ? contacts?.map((c: Contact) => ({ _id: c._id, label: c.name })) || [] :
          assignDialogType === "assignInstitution" ? institutions?.map((i: Institution) => ({ _id: i._id, label: `${i.institutionCode} ${i.name}` })) || [] :
          assignDialogType === "assignOperator" ? operators?.map((o: Operator) => ({ _id: o._id, label: `${o.firstName} ${o.lastName}` })) || [] :
          assignDialogType === "assignStore" ? stores?.map(s => ({ _id: s._id, label: s.name })) || [] :
          []
        }
        selectedItem={selectedItem}
        onSelect={(id) => setSelectedItem(id)}
        onSave={handleSubmitDialog}
        isContactAssignment={assignDialogType === "assignContact"}
        institutions={institutions}
        classes={classes}
      />

      {editClassData && <EditClassDialog classData={editClassData} onClose={() => setEditClassData(null)} />}
      {addDialogOpen && <AddClassDialog onClose={() => setAddDialogOpen(false)} />}
    </Box>
  );
};

export default ClassList;
