import DashboardLayout from "@/components/Layout/DashboardLayout";
import Attendence from "@/pages/Attendence";
import Billing from "@/pages/Billing";
import Client from "@/pages/Client";
import EditClient from "@/pages/Client/edit";
import CreateClient from "@/pages/Client/new";
import ViewClient from "@/pages/Client/view";
import Profile from "@/pages/Profile";
import ProjectDetail from "@/pages/Project/detail";
import EditProject from "@/pages/Project/edit";
import CreateProject from "@/pages/Project/new";
import ProjectUsers from "@/pages/Project/users";
import ProjectWorklogs from "@/components/project/ProjectWorklogs";
import Request from "@/pages/Request";
import ResetPasswordForm from "@/pages/ResetPassword";
import Setting from "@/pages/Setting";
import ProjectSetting from "@/pages/Setting/ProjectSetting";
import CustomerSetting from "@/pages/Setting/CustomerSetting";
import DepartmentSetting from "@/pages/Setting/DepartmentSetting";
import MailSettings from "@/pages/Setting/MailSettings";
import ClientReportDocumentTypeSetting from "@/pages/Setting/ClientReportDocumentTypeSetting";
import AllTask from "@/pages/Task/all";
import NewTask from "@/pages/Task/new";
import TaskDetails from "@/pages/Task/task-details";
import EditTaskGroup from "@/pages/TaskGroup/edit";
import TaskSuper from "@/pages/TaskSuper";
import EditTaskSuper from "@/pages/TaskSuper/edit";
import TaskSuperDetailsPage from "@/pages/TaskSuper/details";
import TaskTemplate from "@/pages/TaskTemplate";
import EditTaskTemplate from "@/pages/TaskTemplate/edit";
import AccountDetails from "@/pages/User/AccountDetails";
import BankDetails from "@/pages/User/BankDetails";
import UserDetails from "@/pages/User/details";
import UserEdit from "@/pages/User/edit";
import EducationalDetails from "@/pages/User/EducationalDetails";
import CreateUser from "@/pages/User/new";
import PersonalDetails from "@/pages/User/PersonalDetails";
import TrainingDetails from "@/pages/User/TrainingDetails";
import ContractDetails from "@/pages/User/ContractDetails";
import WorkHourDetails from "@/pages/User/WorkHourDetails";
import PersonalDocumentsDetails from "@/pages/User/PersonalDocumentsDetails";
import UserHistoryDetails from "@/pages/User/UserHistoryDetails";
import LeaveManagement from "@/pages/Leave/LeaveManagement";
import TimeOff from "@/pages/Leave/TimeOff";
import Worklog from "@/pages/Worklog";
import AllWorklogs from "@/pages/Worklog/AllWorklogs";
import NewWorklog from "@/pages/Worklog/new";
import WorklogAdmin from "@/pages/Worklog/AdminWorklog";
import CalendarPage from "@/pages/Calendar";
import WorkhourSettingsPage from "@/pages/Workhour/settings";
import HolidayPage from "@/pages/Holiday";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Project from "../pages/Project";
import Task from "../pages/Task";
import User from "../pages/User";
import PrivateRoute from "./PrivateRoute";
import ProtectedRoute from "./ProtectedRoute";
import ClientPrivateRoute from "./ClientPrivateRoute";
import EditWorklog from "@/pages/Worklog/edit";
import Perimssion from "@/pages/Permission";
import RolePermision from "@/pages/Role/role-permission";
import RolesPage from "@/pages/Role";
import CreateRole from "@/pages/Role/new";
import EditRole from "@/pages/Role/edit";
import LeaveTypeManagementPage from "@/pages/LeaveTypeManagementPage";
import LeaveBalanceManagement from "@/pages/Admin/LeaveBalanceManagement";
import TodoTaskPage from "@/pages/TodoTask";
import TaskTypeSettings from "@/pages/TodoTask/TaskTypeSettings";
import NoticeBoardPage from "@/pages/NoticeBoard";
import NoticeBoardAdmin from "@/pages/NoticeBoard/Admin";
import CreateNoticePage from "@/pages/NoticeBoard/Create";
import EditNoticePage from "@/pages/NoticeBoard/Edit";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import UserAvailabilityDashboard from "@/pages/Project/availability";
// Client Portal imports
import {
  ClientLogin,
  ClientDashboardHome,
  ClientProjects,
  ClientCompany,
  ClientReports,
  ClientForgotPassword,
  ClientResetPassword
} from "@/pages/ClientPortal";
import ClientPortalLayout from "@/components/Layout/ClientPortalLayout";
// Admin client report management
import ClientReportsAdmin from "@/pages/ClientReportsAdmin";
import ClientUsersAdmin from "@/pages/ClientUsersAdmin";
import ReportsPage from "@/pages/Reports";
import NotFound from "@/pages/NotFound";

const Router = [
  // Client Portal Routes (public)
  {
    path: "/client-login",
    element: <ClientLogin />,
  },
  {
    path: "/client-forgot-password",
    element: <ClientForgotPassword />,
  },
  {
    path: "/client/reset-password/:token",
    element: <ClientResetPassword />,
  },
  // Client Portal Routes (protected)
  {
    path: "/client-portal",
    element: <ClientPrivateRoute />,
    children: [
      {
        path: "",
        element: <ClientPortalLayout />,
        children: [
          {
            path: "",
            element: <ClientDashboardHome />,
          },
          {
            path: "projects",
            element: <ClientProjects />,
          },
          {
            path: "company",
            element: <ClientCompany />,
          },
          {
            path: "reports",
            element: <ClientReports />,
          },
          {
            path: "*",
            element: <NotFound isClientPortal />,
          },
        ],
      },
    ],
  },
  // Staff Routes
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/reset/:token",
    element: <ResetPasswordForm />,
  },
  {
    path: "/",
    element: (
      <DashboardLayout>
        <PrivateRoute />
      </DashboardLayout>
    ),
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute
            method="get"
            resource="user"
            component={<Dashboard />}
          />
        ),
      },

      {
        path: "/projects",
        element: (
          <ProtectedRoute
            method="get"
            resource="projects"
            component={<Project />}
          />
        ),
      },
      {
        path: "/projects/new",
        element: (
          <ProtectedRoute
            method="post"
            resource="projects"
            component={<CreateProject />}
          />
        ),
      },
      {
        path: "/project/edit/:id",
        element: (
          <ProtectedRoute
            method="patch"
            resource="projects"
            component={<EditProject />}
          />
        ),
      },
      {
        path: "/project/detail/:id",
        element: <ProjectDetail />,
      },
      {
        path: "/projects/availability",
        element: (
          <ProtectedRoute
            method="get"
            resource="projects"
            component={<UserAvailabilityDashboard />}
          />
        ),
      },
      {
        path: "/task",
        element: <Task />,
      },
      {
        path: "/tasks",
        element: <AllTask />,
      },
      {
        path: "/requests",
        element: <Request />,
      },
      {
        path: "/task-template",
        element: (
          <ProtectedRoute
            method="get"
            resource="task-super"
            component={<TaskSuper />}
          />
        ),
      },
      {
        path: "/task-template/category/:id",
        element: (
          <ProtectedRoute
            method="get"
            resource="task-super"
            component={<TaskSuperDetailsPage />}
          />
        ),
      },
      // Remove the direct path to TaskSuper but keep the edit route
      {
        path: "/tasksuper/edit/:id",
        element: (
          <ProtectedRoute
            method="patch"
            resource="task-super"
            component={<EditTaskSuper />}
          />
        ),
      },

      {
        path: "/task-group/edit/:id",
        element: <EditTaskGroup />,
      },
      {
        path: "/project/:id/task/:id/worklog",
        element: <Worklog />,
      },
      {
        path: "/task-template/:id",
        element: (
          <ProtectedRoute
            method="get"
            resource="task-template"
            component={<TaskTemplate />}
          />
        ),
      },

      {
        path: "/task-template/edit/:id",
        element: (
          <ProtectedRoute
            method="patch"
            resource="task-template"
            component={<EditTaskTemplate />}
          />
        ),
      },
      {
        path: "/users",
        element: (
          <ProtectedRoute method="get" resource="user" component={<User />} />
        ),
      },
      {
        path: "/user/new",
        element: (
          <ProtectedRoute
            method="post"
            resource="user"
            component={<CreateUser />}
          />
        ),
      },
      {
        path: "/user/:id",
        element: <UserDetails />,
      },
      {
        path: "/user/:id/history",
        element: <UserHistoryDetails />,
      },
      {
        path: "/user/:id/edit",
        element: (
          <ProtectedRoute
            method="patch"
            path="/users/:id"
            resource="user"
            component={<UserEdit />}
          />
        ),
      },
      {
        path: "/client",
        element: (
          <ProtectedRoute method="get" resource="client" component={<Client />} />
        ),
      },
      {
        path: "/client/new",
        element: (
          <ProtectedRoute method="post" resource="client" component={<CreateClient />} />
        ),
      },
      {
        path: "/client/edit/:id",
        element: (
          <ProtectedRoute method="patch" resource="client" component={<EditClient />} />
        ),
      },
      {
        path: "/client/view/:id",
        element: (
          <ProtectedRoute method="get" resource="client" component={<ViewClient />} />
        ),
      },
      {
        path: "/client/:id",
        element: (
          <ProtectedRoute method="get" resource="client" component={<ViewClient />} />
        ),
      },
      {
        path: "/billing",
        element: (
          <ProtectedRoute
            method="get"
            resource="billing"
            component={<Billing />}
          />
        ),
      },
      {
        path: "/attendance",
        element: (
          <ProtectedRoute
            method="get"
            resource="attendance"
            component={<Attendence />}
          />
        ),
      },
      {
        path: "worklogs-all",
        element: (
          <ProtectedRoute
            method="get"
            resource="worklogs"
            path="/worklogs/user"
            component={<AllWorklogs />}
          />
        ),
      },
      {
        path: "worklog/allworklog",
        element: (
          <ProtectedRoute
            method="get"
            resource="worklogs"
            path="/worklogs/allworklog"
            component={<WorklogAdmin />}
          />
        ),
      },
      {
        path: "worklogs/edit/:id",
        element: <EditWorklog />,
      },
      {
        path: "worklogs/new",
        element: <NewWorklog />,
      },
      {
        path: "/projects/:id",
        element: <ProjectDetail />,
      },
      {
        path: "/projects/:id/users",
        element: <ProjectUsers />,
      },
      {
        path: "/projects/:id/tasks",
        element: <Task />,
      },
      {
        path: "/projects/:pid/tasks/:tid",
        element: <TaskDetails />,
      },
      {
        path: "/projects/:id/tasks/new",
        element: <NewTask />,
      },
      {
        path: "/projects/:id/worklogs",
        element: (
          <ProtectedRoute
            method="get"
            resource="worklogs"
            path="/projects/:id/worklogs"
            component={<ProjectWorklogs showHeader />}
          />
        ),
      },
      {
        path: "/projects/:id/worklogs/new",
        element: <NewWorklog />,
      },
      {
        path: "/profile/:id",
        element: <Profile component={PersonalDetails}/>,
      },
      {
        path: "/account-detail/:id",
        element: <AccountDetails />,
      },
      {
        path: "profile/:id/personal-detail",
        element: <Profile component={PersonalDetails}/>,
      },
      {
        path: "profile/:id/educational-detail",
        element: <Profile component={EducationalDetails}/>,
      },
      {
        path: "profile/:id/bank-detail",
        element: <Profile component={BankDetails} />,
      },
      {
        path: "profile/:id/training-detail",
        element: <Profile component={TrainingDetails} />,
      },
      {
        path: "profile/:id/workhour-detail",
        element: <Profile component={WorkHourDetails} />,
      },
      {
        path: "profile/:id/leave-detail",
        element: <Profile component={LeaveManagement} />,
      },
      {
        path: "profile/:id/contract-detail",
        element: <Profile component={ContractDetails} />,
      },
      {
        path: "profile/:id/document-detail",
        element: <Profile component={PersonalDocumentsDetails} />,
      },
      {
        path: "profile/:id/history",
        element: <UserHistoryDetails />,
      },
      {
        path: "/calendar",
        element: <CalendarPage />,
      },
      {
        path: "/settings",
        element: <Setting />,
      },
      {
        path: "/project-setting",
        element: <ProjectSetting />,
      },
      {
        path: "/customer-setting",
        element: <CustomerSetting />,
      },
      {
        path: "/department-setting",
        element: <DepartmentSetting />,
      },
      {
        path: "/mail-settings",
        element: (
          <ProtectedRoute
            method="get"
            resource="mailSettings"
            component={<MailSettings />}
          />
        ),
      },
      {
        path: "/client-report-document-types",
        element: (
          <ProtectedRoute
            method="get"
            resource="client-report-document-type"
            component={<ClientReportDocumentTypeSetting />}
          />
        ),
      },
      {
        path: "/workhour-settings",
        element: (
          <ProtectedRoute
            method="get"
            resource="workhour"
            component={<WorkhourSettingsPage />}
          />
        ),
      },
      {
        path: "/holiday",
        element: (
          <ProtectedRoute
            method="get"
            resource="holiday"
            component={<HolidayPage />}
          />
        ),
      },
       {
  path: "/permission",
  element: (
    <ProtectedRoute
      method="get"
      resource="permission"
      component={<Perimssion />}
    />
  ),
},
{
  path: "/role",
  element: (
    <ProtectedRoute
      method="get"
      resource="role"
      component={<RolesPage />}
    />
  ),
},
{
  path: "/role/new",
  element: (
    <ProtectedRoute
      method="post"
      resource="role"
      component={<CreateRole />}
    />
  ),
},
{
  path: "/role/edit/:id",
  element: (
    <ProtectedRoute
      method="put"
      resource="role"
      component={<EditRole />}
    />
  ),
},
{
  path: "/role/permission/:id",
  element: (
    <ProtectedRoute
      method="put"
      resource="role"
      component={<RolePermision />}
    />
  ),
},
{
  path: "/leave-types",
  element: (
    <ProtectedRoute
      method="get"
      resource="leave-type"
      component={<LeaveTypeManagementPage />}
    />
  ),
},
{
  path: "/leave-management",
  element: (
    <ProtectedRoute
      method="get"
      resource="leave"
      component={<LeaveManagement />}
    />
  ),
},
{
  // Redesigned Time Off module (BS/AD, Odoo-inspired UX)
  path: "/time-off",
  element: (
    <ProtectedRoute
      method="get"
      resource="leave"
      component={<TimeOff />}
    />
  ),
},
{
  path: "/leave-balance-management",
  element: (
    <ProtectedRoute
      method="post"
      resource="leave"
      component={<LeaveBalanceManagement />}
    />
  ),
},
{
  path: "/todotask",
  element: (
    <ProtectedRoute
      method="get"
      resource="todo-task"
      component={<TodoTaskPage />}
    />
  ),
},
{
  path: "/todotask/task-types",
  element: (
    <ProtectedRoute
      method="get"
      resource="task-type"
      component={<TaskTypeSettings />}
    />
  ),
},
{
  path: "/notice-board",
  element: <NoticeBoardPage />,
},
{
  path: "/notice-board/admin",
  element: (
    <ProtectedRoute
      method="get"
      resource="notice-board"
      component={<NoticeBoardAdmin />}
    />
  ),
},
{
  path: "/notice-board/create",
  element: (
    <ProtectedRoute
      method="post"
      resource="notice-board"
      component={<CreateNoticePage />}
    />
  ),
},
{
  path: "/notice-board/edit/:id",
  element: (
    <ProtectedRoute
      method="patch"
      resource="notice-board"
      component={<EditNoticePage />}
    />
  ),
},
// Client Reports Admin Routes
{
  path: "/client-reports",
  element: (
    <ProtectedRoute
      method="get"
      resource="client-reports"
      component={<ClientReportsAdmin />}
    />
  ),
},
{
  path: "/client-users",
  element: (
    <ProtectedRoute
      method="get"
      resource="client-users"
      component={<ClientUsersAdmin />}
    />
  ),
},
{
  path: "/reports",
  element: (
    <ProtectedRoute
      method="get"
      resource="reports"
      component={<ReportsPage />}
    />
  ),
},
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default Router;




 