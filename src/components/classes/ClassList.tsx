import React, { useState, useMemo } from "react";
import { Box, Button, IconButton, TextField, Typography, Menu, MenuItem } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useFetchClasses, useDeleteClass, useUpdateClass } from "../../queries/classQueries";
import { useUpdateOperator } from "../../queries/operatorQueries";
import { useFetchStores, useUpdateStore } from "../../queries/storeQueries";
import EditClassDialog from "./EditClassDialog";
import AddClassDialog from "./AddClassDialog";
import CoordinatorAssignmentDialog from "../coordinator/CoordinatorAssignmentDialog";

const ClassList: React.FC = () => {
  const { data: classes, isLoading, isError } = useFetchClasses();
  const { data: stores } = useFetchStores();
  const deleteMutation = useDeleteClass();
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editClassData, setEditClassData] = useState<any | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const updateClassMutation = useUpdateClass();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignDialogType, setAssignDialogType] = useState<"assignContact" | "assignInstitution" | "assignOperator" | "assignStore" | null>(null);
  const [coordinatorDialogOpen, setCoordinatorDialogOpen] = useState(false);
  const [selectedClassForCoordinator, setSelectedClassForCoordinator] = useState<any>(null);

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

  const handleAssignCoordinator = (classData: any) => {
    setSelectedClassForCoordinator(classData);
    setCoordinatorDialogOpen(true);
  };

  const handleCoordinatorAssign = async (coordinatorId: string) => {
    if (selectedClassForCoordinator) {
      try {
        await updateClassMutation.mutateAsync({
          id: selectedClassForCoordinator._id,
          updatedClass: { coordinatorId }
        });
        window.location.reload();
      } catch (error) {
        console.error('Error assigning coordinator:', error);
      }
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "institutionCode",
      headerName: "קוד מוסד",
      width: 100,
    },{
      field: "institutionName",
      headerName: "שם מוסד",
      width: 100,
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
    { field: "gender", headerName: "בנים או בנות", width: 120 },
    {
      field: "education",
      headerName: "חינוך",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (params.value ? "מיוחד" : "רגיל"),
    },
    {
      field: "actions",
      headerName: "פעולות",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton color="primary" onClick={() => setEditClassData(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="info" onClick={() => handleAssignCoordinator(params.row)} title="שייך רכז">
            👥
          </IconButton>
          <IconButton color="secondary" onClick={() => handleDelete(params.row._id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ], [stores]);

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


      {editClassData && <EditClassDialog classData={editClassData} onClose={() => setEditClassData(null)} />}
      {addDialogOpen && <AddClassDialog onClose={() => setAddDialogOpen(false)} />}
      {coordinatorDialogOpen && (
        <CoordinatorAssignmentDialog
          open={coordinatorDialogOpen}
          onClose={() => setCoordinatorDialogOpen(false)}
          type="class"
          item={selectedClassForCoordinator}
          onAssign={handleCoordinatorAssign}
        />
      )}
    </Box>
  );
};

export default ClassList;
