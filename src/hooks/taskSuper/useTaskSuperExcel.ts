import * as XLSX from 'xlsx';
import { message, Modal } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { createTaskSuper, deleteTaskSuper, fetchTaskSuper } from '../../service/taskSuper.service';
import { createTaskGroup } from '../../service/taskgroup.service';
import { createTaskTemplate } from '../../service/tasktemplate.service';
export const useTaskSuperExcel = () => {
  const queryClient = useQueryClient();
  const exportToExcel = (taskSuper: any) => {
    try {
      const rows: any[] = [];
      const taskSuperName = taskSuper.name || '';
      const taskSuperDesc = taskSuper.description || '';
      let isFirstSuper = true;
      if (!taskSuper.taskGroup || taskSuper.taskGroup.length === 0) {
        rows.push({
          'Task Super Name': taskSuperName,
          'Task Super Description': taskSuperDesc,
          'Task Group Name': '',
          'Task Group Description': '',
          'Task Name': '',
          'Task Description': '',
          'Task Budgeted Hours': '',
          'Subtask Name': '',
          'Subtask Description': '',
          'Subtask Budgeted Hours': ''
        });
      } else {
        taskSuper.taskGroup.forEach((group: any) => {
          const groupName = group.name || '';
          const groupDesc = group.description || '';
          const groupRank = group.rank || '';
          let isFirstGroup = true;
          if (!group.tasktemplate || group.tasktemplate.length === 0) {
            rows.push({
              'Task Super Name': isFirstSuper ? taskSuperName : '',
              'Task Super Description': isFirstSuper ? taskSuperDesc : '',
              'Task Group Name': groupName,
              'Task Group Description': groupDesc,
              'Task Name': '',
              'Task Description': '',
              'Task Budgeted Hours': '',
              'Subtask Name': '',
              'Subtask Description': '',
              'Subtask Budgeted Hours': ''
            });
            isFirstSuper = false;
          } else {
            const storyTemplates = group.tasktemplate.filter((t: any) => t.taskType === 'story');
            if (storyTemplates.length === 0) {
              rows.push({
                'Task Super Name': isFirstSuper ? taskSuperName : '',
                'Task Super Description': isFirstSuper ? taskSuperDesc : '',
                'Task Group Name': groupName,
                'Task Group Description': groupDesc,
                'Task Name': '',
                'Task Description': '',
                'Task Budgeted Hours': '',
                'Subtask Name': '',
                'Subtask Description': '',
                'Subtask Budgeted Hours': ''
              });
              isFirstSuper = false;
            }
            storyTemplates.forEach((task: any) => {
              const taskName = task.name || '';
              const taskDesc = task.description || '';
              const taskHours = task.budgetedHours || '';
              const taskRank = task.rank || '';
              let isFirstTask = true;
              if (!task.subTasks || task.subTasks.length === 0) {
                rows.push({
                  'Task Super Name': isFirstSuper ? taskSuperName : '',
                  'Task Super Description': isFirstSuper ? taskSuperDesc : '',
                  'Task Group Name': isFirstGroup ? groupName : '',
                  'Task Group Description': isFirstGroup ? groupDesc : '',
                  'Task Name': taskName,
                  'Task Description': taskDesc,
                  'Task Budgeted Hours': taskHours,
                  'Subtask Name': '',
                  'Subtask Description': '',
                  'Subtask Budgeted Hours': ''
                });
                isFirstSuper = false;
                isFirstGroup = false;
              } else {
                task.subTasks.forEach((subtask: any) => {
                  rows.push({
                    'Task Super Name': isFirstSuper ? taskSuperName : '',
                    'Task Super Description': isFirstSuper ? taskSuperDesc : '',
                    'Task Group Name': isFirstGroup ? groupName : '',
                    'Task Group Description': isFirstGroup ? groupDesc : '',
                    'Task Name': isFirstTask ? taskName : '',
                    'Task Description': isFirstTask ? taskDesc : '',
                    'Task Budgeted Hours': isFirstTask ? taskHours : '',
                    'Subtask Name': subtask.name || '',
                    'Subtask Description': subtask.description || '',
                    'Subtask Budgeted Hours': subtask.budgetedHours || ''
                  });
                  isFirstSuper = false;
                  isFirstGroup = false;
                  isFirstTask = false;
                });
              }
            });
          }
        });
      }
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
      XLSX.writeFile(workbook, `${taskSuperName}_Tasks.xlsx`);
      message.success('Exported to Excel successfully');
    } catch (error) {
      message.error('Failed to export to Excel');
    }
  };
  const downloadSampleExcel = () => {
    const sampleData: any[] = [];
    let isFirstSuper = true;
    for (let g = 1; g <= 5; g++) {
      let isFirstGroup = true;
      for (let t = 1; t <= 2; t++) {
        let isFirstTask = true;
        for (let s = 1; s <= 3; s++) {
          sampleData.push({
            'Task Super Name': isFirstSuper ? 'Software Launch Plan' : '',
            'Task Super Description': isFirstSuper ? 'Standard template for launching a new software product' : '',
            'Task Group Name': isFirstGroup ? `Phase ${g}` : '',
            'Task Group Description': isFirstGroup ? `Description for Phase ${g}` : '',
            'Task Name': isFirstTask ? `Task ${g}.${t}` : '',
            'Task Description': isFirstTask ? `Implementation of Task ${g}.${t}` : '',
            'Task Budgeted Hours': isFirstTask ? '10' : '',
            'Subtask Name': `Subtask ${g}.${t}.${s}`,
            'Subtask Description': `Execution of Subtask ${g}.${t}.${s}`,
            'Subtask Budgeted Hours': '2'
          });
          isFirstSuper = false;
          isFirstGroup = false;
          isFirstTask = false;
        }
      }
    }
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample');
    XLSX.writeFile(workbook, 'TaskSuper_Import_Template.xlsx');
  };
  const importExcel = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet);
          if (!rows || rows.length === 0) {
            message.error('Excel file is empty');
            return reject('Empty file');
          }
          // Group the rows hierarchically
          const hierarchy: any = {};
          let targetTaskSuperName = '';
          let targetTaskSuperDesc = '';
          let currentSuperName = '';
          let currentSuperDesc = '';
          let currentGroupName = '';
          let currentGroupDesc = '';
          let currentTaskName = '';
          rows.forEach((row: any) => {
            const tsName = row['Task Super Name']?.toString().trim();
            if (tsName) {
              currentSuperName = tsName;
              currentSuperDesc = row['Task Super Description']?.toString().trim() || '';
            }
            if (!targetTaskSuperName && currentSuperName) {
              targetTaskSuperName = currentSuperName;
              targetTaskSuperDesc = currentSuperDesc;
            }
            const tgName = row['Task Group Name']?.toString().trim();
            if (tgName) {
              currentGroupName = tgName;
              currentGroupDesc = row['Task Group Description']?.toString().trim() || '';
            }
            if (currentGroupName && !hierarchy[currentGroupName]) {
              hierarchy[currentGroupName] = {
                description: currentGroupDesc,
                rank: Object.keys(hierarchy).length + 1,
                tasks: {}
              };
            }
            const tName = row['Task Name']?.toString().trim();
            if (tName) {
              currentTaskName = tName;
              if (currentGroupName && !hierarchy[currentGroupName].tasks[currentTaskName]) {
                hierarchy[currentGroupName].tasks[currentTaskName] = {
                  description: row['Task Description']?.toString().trim() || '',
                  budgetedHours: parseFloat(row['Task Budgeted Hours']) || 0,
                  rank: Object.keys(hierarchy[currentGroupName].tasks).length + 1,
                  subtasks: []
                };
              }
            }
            const stName = row['Subtask Name']?.toString().trim();
            if (stName && currentGroupName && currentTaskName) {
              hierarchy[currentGroupName].tasks[currentTaskName].subtasks.push({
                name: stName,
                description: row['Subtask Description']?.toString().trim() || '',
                budgetedHours: parseFloat(row['Subtask Budgeted Hours']) || 0,
                rank: hierarchy[currentGroupName].tasks[currentTaskName].subtasks.length + 1,
              });
            }
          });
          if (!targetTaskSuperName) {
            message.error('No Task Super Name found in the Excel file');
            return reject('Missing Task Super Name');
          }
          // Check if Task Super exists
          const allTaskSupers = await fetchTaskSuper();
          let taskSuperId = null;
          const tsArray = Array.isArray(allTaskSupers) ? allTaskSupers : (allTaskSupers?.tasksuper || []);
          const existingTaskSuper = tsArray.find(
            (ts: any) => ts.name.toLowerCase() === targetTaskSuperName.toLowerCase()
          );
          if (existingTaskSuper) {
            const confirmOverwrite = await new Promise((resolveConfirm) => {
              Modal.confirm({
                title: 'Category Already Exists',
                content: `The category '${targetTaskSuperName}' already exists. Do you want to overwrite it? This will delete the existing category.`,
                okText: 'Overwrite',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => resolveConfirm(true),
                onCancel: () => resolveConfirm(false),
              });
            });
            if (!confirmOverwrite) {
              return reject('User cancelled overwrite');
            }
            // Delete existing
            await deleteTaskSuper({ id: existingTaskSuper.id });
          }
          message.loading({ content: 'Creating Task Super hierarchy...', key: 'excelUpload', duration: 0 });
          // 1. Create Task Super
          const createdTaskSuper = await createTaskSuper({
            name: targetTaskSuperName,
            description: targetTaskSuperDesc
          });
          taskSuperId = createdTaskSuper.id;
          // 2. Iterate groups
          for (const [groupName, groupData] of Object.entries(hierarchy)) {
            const groupDataTyped = groupData as any;
            const createdGroup = await createTaskGroup({
              name: groupName,
              description: groupDataTyped.description,
              rank: groupDataTyped.rank,
              taskSuperId: taskSuperId
            });
            // 3. Iterate tasks
            for (const [taskName, taskData] of Object.entries(groupDataTyped.tasks)) {
              const taskDataTyped = taskData as any;
              const createdTask = await createTaskTemplate({
                name: taskName,
                description: taskDataTyped.description,
                budgetedHours: taskDataTyped.budgetedHours,
                rank: taskDataTyped.rank,
                taskType: 'story',
                groupId: createdGroup.id
              });
              // 4. Iterate subtasks
              for (const subtask of taskDataTyped.subtasks) {
                await createTaskTemplate({
                  name: subtask.name,
                  description: subtask.description,
                  budgetedHours: subtask.budgetedHours,
                  rank: subtask.rank,
                  taskType: 'task', // taskType 'task' means subtask in this system
                  groupId: createdGroup.id,
                  parentTaskId: createdTask.id
                });
              }
            }
          }
          queryClient.invalidateQueries({ queryKey: ["taskSuper"] });
          message.success({ content: 'Excel imported successfully!', key: 'excelUpload', duration: 3 });
          resolve();
        } catch (err: any) {
          message.error({ content: `Failed to import Excel: ${err.message || 'Unknown error'}`, key: 'excelUpload', duration: 5 });
          reject(err);
        }
      };
      reader.onerror = (error) => {
        message.error('Failed to read file');
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  };
  return {
    exportToExcel,
    downloadSampleExcel,
    importExcel
  };
};
