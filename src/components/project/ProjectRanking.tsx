import { useEffect, useState, useMemo } from "react";
import { Button, Card, message, Space, Typography, Empty, Spin } from "antd";
import { useParams } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { 
  SaveOutlined, 
  PlusOutlined, 
  MinusOutlined,
  DragOutlined
} from "@ant-design/icons";
// @ts-ignore - This component uses react-beautiful-dnd which has type issues
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useFetchTaskRankings } from "@/hooks/taskRanking/useFetchTaskRankings";
import { TaskRankingPayload } from "@/service/taskranking.service";
import { useUpdateTaskRankings } from "@/hooks/taskRanking/useUpdateTaskRankings";
import { useUpdateTaskSuperRankings } from "@/hooks/taskRanking/useUpdateTaskSuperRankings";
import { useUpdateTaskGroupRankings } from "@/hooks/taskRanking/useUpdateTaskGroupRankings";

interface Task {
  id: string;
  name: string;
  taskType: string;
  rank: number;
  budgetedHours: number;
  groupProject?: {
    id: string;
    taskSuperId?: string;
  };
  parentTask?: {
    id: string;
  };
}

interface TaskGroupProject {
  id: string;
  name: string;
  description?: string;
  rank: number;
  taskSuperId?: string;
}

interface TaskSuperProject {
  id: string;
  name: string;
  description?: string;
  rank: number;
}

// Types for ranking items

// For hierarchical data items
interface HierarchicalItem {
  id: string;
  name?: string;
  description?: string;
  rank?: number;
  type: 'taskSuper' | 'taskGroup' | 'task' | 'subtask';
  isBlank?: boolean;
  parentId?: string;
  item?: Task | TaskGroupProject | TaskSuperProject;
}

const ProjectRanking = () => {
  const { id } = useParams();
  const { permissions } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskGroupProjects, setTaskGroupProjects] = useState<TaskGroupProject[]>([]);
  const [taskSuperProjects, setTaskSuperProjects] = useState<TaskSuperProject[]>([]);
  const [expandedSupers, setExpandedSupers] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(true); // Always in edit mode
  const [filterType] = useState("all"); // Keep this for filtering logic

  // Fetch task rankings data
  const { data: rankingsData, isPending } = useFetchTaskRankings(id);
  
  // Update task rankings mutations
  const { mutate: updateTaskRankings, isPending: isUpdatingTasks } = useUpdateTaskRankings();
  const { mutate: updateTaskSuperRankings, isPending: isUpdatingSuperTasks } = useUpdateTaskSuperRankings();
  const { mutate: updateTaskGroupRankings, isPending: isUpdatingGroupTasks } = useUpdateTaskGroupRankings();

  // Check if user has permission to edit rankings
  const canEditRanking = permissions?.some(
    (permission: any) => permission.resource === "task-ranking" && permission.method === "patch"
  ) || true; // Always allow editing for now

  useEffect(() => {
    if (rankingsData) {
      setTasks(rankingsData.tasks || []);
      setTaskGroupProjects(rankingsData.taskGroupProjects || []);
      setTaskSuperProjects(rankingsData.taskSuperProjects || []);
    }
  }, [rankingsData]);

  // Organize data for hierarchical display
  const hierarchicalData = useMemo(() => {
    // Sort all entities by rank
    const sortedTaskSupers = [...taskSuperProjects].sort((a, b) => a.rank - b.rank);
    const sortedTaskGroups = [...taskGroupProjects].sort((a, b) => a.rank - b.rank);
    const sortedTasks = [...tasks].sort((a, b) => a.rank - b.rank);
    
    // Create hierarchical structure
    const result: HierarchicalItem[] = [];
    
    // First, process TaskSuperProjects
    for (const taskSuper of sortedTaskSupers) {
      if (!taskSuper || !taskSuper.id) continue; // Skip invalid task supers
      
      result.push({
        id: taskSuper.id,
        name: taskSuper.name,
        description: taskSuper.description,
        rank: taskSuper.rank,
        type: 'taskSuper',
        item: taskSuper
      });
      
      // Find TaskGroupProjects for this TaskSuperProject
      const relatedGroups = sortedTaskGroups
        .filter(group => group && group.taskSuperId === taskSuper.id)
        .sort((a, b) => a.rank - b.rank);
      
      // Add blank TaskGroup row if no TaskGroups exist
      if (relatedGroups.length === 0) {
        result.push({
          id: `blank-group-${taskSuper.id}`,
          isBlank: true,
          type: 'taskGroup',
          parentId: taskSuper.id
        });
      } else {
        // Add TaskGroupProjects related to this TaskSuperProject
        for (const group of relatedGroups) {
          if (!group || !group.id) continue; // Skip invalid groups
          
          result.push({
            id: group.id,
            name: group.name,
            description: group.description,
            rank: group.rank,
            type: 'taskGroup',
            parentId: taskSuper.id,
            item: group
          });
          
          // Find Tasks for this TaskGroupProject
          const relatedTasks = sortedTasks
            .filter(task => {
              if (!task || !task.groupProject || !task.groupProject.id) return false;
              return (
                task.groupProject.id === group.id && 
                task.taskType === 'story' && 
                (!task.parentTask || !task.parentTask.id)
              );
            })
            .sort((a, b) => a.rank - b.rank);
          
          // Add blank Task row if no Tasks exist
          if (relatedTasks.length === 0) {
            result.push({
              id: `blank-task-${group.id}`,
              isBlank: true,
              type: 'task',
              parentId: group.id
            });
          } else {
            // Add Tasks related to this TaskGroupProject
            for (const task of relatedTasks) {
              if (!task || !task.id) continue; // Skip invalid tasks
              
              result.push({
                id: task.id,
                name: task.name,
                description: task.taskType,
                rank: task.rank,
                type: 'task',
                parentId: group.id,
                item: task
              });
              
              // Find Subtasks for this Task
              const relatedSubtasks = sortedTasks
                .filter(subtask => {
                  if (!subtask || !subtask.parentTask || !subtask.parentTask.id) return false;
                  return subtask.parentTask.id === task.id && subtask.taskType === 'task';
                })
                .sort((a, b) => a.rank - b.rank);
              
              // Add blank Subtask row if no Subtasks exist
              if (relatedSubtasks.length === 0) {
                result.push({
                  id: `blank-subtask-${task.id}`,
                  isBlank: true,
                  type: 'subtask',
                  parentId: task.id
                });
              } else {
                // Add Subtasks related to this Task
                for (const subtask of relatedSubtasks) {
                  if (!subtask || !subtask.id) continue; // Skip invalid subtasks
                  
                  result.push({
                    id: subtask.id,
                    name: subtask.name,
                    description: subtask.taskType,
                    rank: subtask.rank,
                    type: 'subtask',
                    parentId: task.id,
                    item: subtask
                  });
                }
              }
            }
          }
        }
      }
    }
    
    // Handle standalone TaskGroupProjects (no TaskSuperProject)
    const standaloneGroups = sortedTaskGroups
      .filter(group => !group.taskSuperId)
      .sort((a, b) => a.rank - b.rank);
    
    // Add blank TaskSuper row if we have standalone TaskGroups
    if (standaloneGroups.length > 0) {
      result.push({
        id: 'blank-super-standalone',
        isBlank: true,
        type: 'taskSuper'
      });
      
      // Add standalone TaskGroupProjects
      for (const group of standaloneGroups) {
        result.push({
          id: group.id,
          name: group.name,
          description: group.description,
          rank: group.rank,
          type: 'taskGroup',
          item: group
        });
        
        // Find Tasks for this standalone TaskGroupProject
        const relatedTasks = sortedTasks
          .filter(task => task.groupProject?.id === group.id && task.taskType === 'story' && !task.parentTask)
          .sort((a, b) => a.rank - b.rank);
        
        // Add blank Task row if no Tasks exist
        if (relatedTasks.length === 0) {
          result.push({
            id: `blank-task-${group.id}`,
            isBlank: true,
            type: 'task',
            parentId: group.id
          });
        } else {
          // Add Tasks related to this standalone TaskGroupProject
          for (const task of relatedTasks) {
            result.push({
              id: task.id,
              name: task.name,
              description: task.taskType,
              rank: task.rank,
              type: 'task',
              parentId: group.id,
              item: task
            });
            
        // Find Subtasks for this Task
        const relatedSubtasks = sortedTasks
          .filter(subtask => {
            if (!subtask || !subtask.parentTask) return false;
            
            // Explicitly check for NaN and other invalid values
            const parentId = subtask.parentTask.id;
            if (!parentId || parentId === 'NaN' || parentId === 'undefined' || parentId === 'null') {
              return false;
            }
            
            return parentId === task.id && subtask.taskType === 'task';
          })
          .sort((a, b) => a.rank - b.rank);            // Add blank Subtask row if no Subtasks exist
            if (relatedSubtasks.length === 0) {
              result.push({
                id: `blank-subtask-${task.id}`,
                isBlank: true,
                type: 'subtask',
                parentId: task.id
              });
            } else {
              // Add Subtasks related to this Task
              for (const subtask of relatedSubtasks) {
                result.push({
                  id: subtask.id,
                  name: subtask.name,
                  description: subtask.taskType,
                  rank: subtask.rank,
                  type: 'subtask',
                  parentId: task.id,
                  item: subtask
                });
              }
            }
          }
        }
      }
    }
    
    // Handle standalone Tasks (no TaskGroupProject)
    const standaloneTasks = sortedTasks
      .filter(task => !task.groupProject && task.taskType === 'story' && !task.parentTask)
      .sort((a, b) => a.rank - b.rank);
    
    // Add blank TaskSuper and TaskGroup rows if we have standalone Tasks
    if (standaloneTasks.length > 0) {
      result.push({
        id: 'blank-super-tasks',
        isBlank: true,
        type: 'taskSuper'
      });
      
      result.push({
        id: 'blank-group-tasks',
        isBlank: true,
        type: 'taskGroup'
      });
      
      // Add standalone Tasks
      for (const task of standaloneTasks) {
        result.push({
          id: task.id,
          name: task.name,
          description: task.taskType,
          rank: task.rank,
          type: 'task',
          item: task
        });
        
        // Find Subtasks for this standalone Task
        const relatedSubtasks = sortedTasks
          .filter(subtask => {
            if (!subtask || !subtask.parentTask) return false;
            
            // Explicitly check for NaN and other invalid values
            const parentId = subtask.parentTask.id;
            if (!parentId || parentId === 'NaN' || parentId === 'undefined' || parentId === 'null') {
              return false;
            }
            
            return parentId === task.id && subtask.taskType === 'task';
          })
          .sort((a, b) => a.rank - b.rank);
        
        // Add blank Subtask row if no Subtasks exist
        if (relatedSubtasks.length === 0) {
          result.push({
            id: `blank-subtask-${task.id}`,
            isBlank: true,
            type: 'subtask',
            parentId: task.id
          });
        } else {
          // Add Subtasks related to this standalone Task
          for (const subtask of relatedSubtasks) {
            result.push({
              id: subtask.id,
              name: subtask.name,
              description: subtask.taskType,
              rank: subtask.rank,
              type: 'subtask',
              parentId: task.id,
              item: subtask
            });
          }
        }
      }
    }
    
    return result;
  }, [taskSuperProjects, taskGroupProjects, tasks]);

  const toggleExpand = (id: string, type: 'super' | 'group' | 'task') => {
    if (type === 'super') {
      setExpandedSupers(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else if (type === 'group') {
      setExpandedGroups(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else {
      setExpandedTasks(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    }
  };

  // No longer using manual up/down movement functions - fully relying on drag and drop



  const handleSaveRanking = async () => {
    if (!id) {
      message.error("Project ID is missing");
      return;
    }

    // Helper function to validate UUID format
    const isValidUUID = (id: any): boolean => {
      if (!id || typeof id !== 'string') return false;
      // Basic UUID format validation (8-4-4-4-12 format)
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    // Filter out any taskSuper projects that might not have valid UUIDs
    const validTaskSuperProjects = taskSuperProjects.filter(item => 
      item && isValidUUID(item.id)
    );
    
    // Save TaskSuperProject rankings
    const superRankings = validTaskSuperProjects.map(item => ({
      taskSuperProjectId: item.id,
      rank: item.rank || 0
    }));
    
    if (superRankings.length > 0) {
      updateTaskSuperRankings({ projectId: id, rankings: superRankings });
    }

    // Filter out any taskGroup projects that might not have valid UUIDs
    const validTaskGroupProjects = taskGroupProjects.filter(item => 
      item && isValidUUID(item.id)
    );
    
    // Save TaskGroupProject rankings
    const groupRankings = validTaskGroupProjects.map(item => ({
      taskGroupProjectId: item.id,
      rank: item.rank || 0
    }));
    
    if (groupRankings.length > 0) {
      updateTaskGroupRankings({ projectId: id, rankings: groupRankings });
    }

    // Filter out any tasks that might not have valid UUIDs
    const validTasks = tasks.filter(task => 
      task && isValidUUID(task.id)
    );
    
    // Save Task rankings
    const taskRankings: TaskRankingPayload[] = validTasks.map(task => ({
      taskId: task.id,
      rank: task.rank || 0
    }));
    
    if (taskRankings.length > 0) {
      updateTaskRankings({ projectId: id, rankings: taskRankings });
    }

    setIsEditing(false);
    message.success("Rankings saved successfully");
  };

  // @ts-ignore - Using any for drag-and-drop results
  const onDragEnd = (result: any, type: 'taskSuper' | 'taskGroup' | 'task' | 'subtask') => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    if (type === 'taskSuper') {
      const reorderedItems = [...taskSuperProjects];
      const [removed] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, removed);
      
      // Update ranks
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      setTaskSuperProjects(updatedItems);
    } else if (type === 'taskGroup') {
      const rawParentId = result.source.droppableId.replace('droppable-taskGroup-', '');
      
      // Skip if parentId is invalid
      if (!rawParentId || rawParentId === 'undefined' || rawParentId === 'null') return;
      
      // Ensure we only filter for valid taskSuperId values - prevent NaN
      const filteredGroups = taskGroupProjects.filter(g => {
        return g && g.taskSuperId === rawParentId;
      });
      
      if (filteredGroups.length === 0) return;
      
      const reorderedItems = [...filteredGroups];
      
      const [removed] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, removed);
      
      // Update ranks for the reordered items
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      // Merge back with the groups not affected by this reordering
      const otherGroups = taskGroupProjects.filter(g => g.taskSuperId !== rawParentId);
      setTaskGroupProjects([...otherGroups, ...updatedItems]);
    } else if (type === 'task') {
      const rawParentId = result.source.droppableId.replace('droppable-task-', '');
      
      // Skip if parentId is invalid
      if (!rawParentId || rawParentId === 'undefined' || rawParentId === 'null') return;
      
      // Ensure we only filter for valid groupProject.id values
      const filteredTasks = tasks.filter(t => 
        t && t.groupProject && t.groupProject.id === rawParentId && 
        t.taskType === 'story' && !t.parentTask
      );
      
      if (filteredTasks.length === 0) return;
      
      const reorderedItems = [...filteredTasks];
      
      const [removed] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, removed);
      
      // Update ranks for the reordered items
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      // Merge back with the tasks not affected by this reordering
      const otherTasks = tasks.filter(t => 
        !t.groupProject || t.groupProject.id !== rawParentId || 
        t.taskType !== 'story' || t.parentTask
      );
      setTasks([...otherTasks, ...updatedItems]);
    } else if (type === 'subtask') {
      const rawParentId = result.source.droppableId.replace('droppable-subtask-', '');
      
      // Skip if parentId is invalid
      if (!rawParentId || rawParentId === 'undefined' || rawParentId === 'null' || rawParentId === 'NaN') return;
      
      // Ensure we only filter for valid parentTask.id values - handle NaN cases explicitly
      const filteredSubtasks = tasks.filter(t => {
        if (!t || !t.parentTask) return false;
        
        const parentId = t.parentTask.id;
        if (!parentId || parentId === 'NaN' || parentId === 'undefined' || parentId === 'null') {
          return false;
        }
        
        return parentId === rawParentId && t.taskType === 'task';
      });
      
      if (filteredSubtasks.length === 0) return;
      
      const reorderedItems = [...filteredSubtasks];
      
      const [removed] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, removed);
      
      // Update ranks for the reordered items
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      // Merge back with the tasks not affected by this reordering
      const otherTasks = tasks.filter(t => {
        if (!t || !t.parentTask) return true;
        
        const parentId = t.parentTask.id;
        if (!parentId || parentId === 'NaN' || parentId === 'undefined' || parentId === 'null') {
          return true;
        }
        
        return parentId !== rawParentId || t.taskType !== 'task';
      });
      
      setTasks([...otherTasks, ...updatedItems]);
    }
  };

  const loading = isPending || isUpdatingTasks || isUpdatingSuperTasks || isUpdatingGroupTasks;

  // Filter hierarchical data based on type
  const filteredData = useMemo(() => {
    if (filterType === 'all') return hierarchicalData;
    
    return hierarchicalData.filter(item => {
      if (item.type === 'taskSuper' || item.type === 'taskGroup') return true;
      
      if (item.type === 'task' || item.type === 'subtask') {
        const taskItem = item.item as Task;
        return taskItem?.taskType === filterType;
      }
      
      return false;
    });
  }, [hierarchicalData, filterType]);

  // Function to render taskSuperProjects and allow drag-and-drop
  
  const handleUnifiedDragEnd = (result: any) => {
    if (!result.destination) return;
    const droppableId = result.source.droppableId;
    if (droppableId === 'droppable-taskSuper') {
      onDragEnd(result, 'taskSuper');
    } else if (droppableId.startsWith('droppable-taskGroup-')) {
      onDragEnd(result, 'taskGroup');
    } else if (droppableId.startsWith('droppable-task-')) {
      onDragEnd(result, 'task');
    } else if (droppableId.startsWith('droppable-subtask-')) {
      onDragEnd(result, 'subtask');
    }
  };

  const renderTaskSuperProjects = () => {
    // Get only the taskSuper items
    const superItems = filteredData.filter(item => item.type === 'taskSuper');
    
    if (superItems.length === 0) {
      return <Empty description="No task super projects found" />;
    }
    
    return (
      <Droppable droppableId="droppable-taskSuper">
          {(provided: any) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {superItems.map((item, index) => (
                <Draggable 
                  key={item.id} 
                  draggableId={item.id} 
                  index={index}
                  isDragDisabled={!isEditing || item.isBlank}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        marginBottom: '8px',
                        ...provided.draggableProps.style
                      }}
                    >
                      <div
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          opacity: item.isBlank ? 0.5 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {isEditing && !item.isBlank && (
                            <div 
                              {...provided.dragHandleProps}
                              style={{ marginRight: '8px', cursor: 'grab' }}
                            >
                              <DragOutlined />
                            </div>
                          )}
                          <Space>
                            <Typography.Text type="secondary">Super Project:</Typography.Text>
                            {!item.isBlank ? (
                              <>
                                <Typography.Text strong>#{item.rank}</Typography.Text>
                                <Typography.Text>{item.name}</Typography.Text>
                              </>
                            ) : (
                              <Typography.Text type="secondary" italic>
                                No Super Project available
                              </Typography.Text>
                            )}
                          </Space>
                        </div>
                        {!item.isBlank && (
                          <Button
                            icon={expandedSupers.includes(item.id) ? <MinusOutlined /> : <PlusOutlined />}
                            size="small"
                            onClick={() => toggleExpand(item.id, 'super')}
                          />
                        )}
                      </div>
                      
                      {/* Render task groups for this taskSuper if expanded */}
                      {!item.isBlank && expandedSupers.includes(item.id) && renderTaskGroups(item.id)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
    );
  };

  // Function to render taskGroups for a given taskSuper
  const renderTaskGroups = (superProjectId: string) => {
    const groupItems = filteredData.filter(
      item => item.type === 'taskGroup' && item.parentId === superProjectId
    );
    
    if (groupItems.length === 0) {
      return <Empty description="No task groups found" style={{ margin: '16px' }} />;
    }
    
    return (
      <div style={{ marginLeft: '32px', marginTop: '8px' }}>
        <Droppable droppableId={`droppable-taskGroup-${superProjectId}`}>
            {(provided: any) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {groupItems.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={!isEditing || item.isBlank}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          marginBottom: '8px',
                          ...provided.draggableProps.style
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#fafafa',
                            border: '1px dashed #d9d9d9',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            opacity: item.isBlank ? 0.5 : 1
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {isEditing && !item.isBlank && (
                              <div 
                                {...provided.dragHandleProps}
                                style={{ marginRight: '8px', cursor: 'grab' }}
                              >
                                <DragOutlined />
                              </div>
                            )}
                            <Space>
                              <Typography.Text type="secondary">Group:</Typography.Text>
                              {!item.isBlank ? (
                                <>
                                  <Typography.Text strong>#{item.rank}</Typography.Text>
                                  <Typography.Text>{item.name}</Typography.Text>
                                </>
                              ) : (
                                <Typography.Text type="secondary" italic>
                                  No Task Group available
                                </Typography.Text>
                              )}
                            </Space>
                          </div>
                          {!item.isBlank && (
                            <Button
                              icon={expandedGroups.includes(item.id) ? <MinusOutlined /> : <PlusOutlined />}
                              size="small"
                              onClick={() => toggleExpand(item.id, 'group')}
                            />
                          )}
                        </div>
                        
                        {/* Render tasks for this taskGroup if expanded */}
                        {!item.isBlank && expandedGroups.includes(item.id) && renderTasks(item.id)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
      </div>
    );
  };

  // Function to render tasks for a given taskGroup
  const renderTasks = (groupId: string) => {
    const taskItems = filteredData.filter(
      item => item.type === 'task' && item.parentId === groupId
    );
    
    if (taskItems.length === 0) {
      return <Empty description="No tasks found" style={{ margin: '16px' }} />;
    }
    
    return (
      <div style={{ marginLeft: '32px', marginTop: '8px' }}>
        <Droppable droppableId={`droppable-task-${groupId}`}>
            {(provided: any) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {taskItems.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={!isEditing || item.isBlank}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          marginBottom: '8px',
                          ...provided.draggableProps.style
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ffffff',
                            border: '1px dotted #d9d9d9',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            opacity: item.isBlank ? 0.5 : 1
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {isEditing && !item.isBlank && (
                              <div 
                                {...provided.dragHandleProps}
                                style={{ marginRight: '8px', cursor: 'grab' }}
                              >
                                <DragOutlined />
                              </div>
                            )}
                            <Space>
                              <Typography.Text type="secondary">Task:</Typography.Text>
                              {!item.isBlank ? (
                                <>
                                  <Typography.Text strong>#{item.rank}</Typography.Text>
                                  <Typography.Text>{item.name}</Typography.Text>
                                  {item.description && (
                                    <Typography.Text type="secondary">({item.description})</Typography.Text>
                                  )}
                                </>
                              ) : (
                                <Typography.Text type="secondary" italic>
                                  No Task available
                                </Typography.Text>
                              )}
                            </Space>
                          </div>
                          {!item.isBlank && (
                            <Button
                              icon={expandedTasks.includes(item.id) ? <MinusOutlined /> : <PlusOutlined />}
                              size="small"
                              onClick={() => toggleExpand(item.id, 'task')}
                            />
                          )}
                        </div>
                        
                        {/* Render subtasks for this task if expanded */}
                        {!item.isBlank && expandedTasks.includes(item.id) && renderSubtasks(item.id)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
      </div>
    );
  };

  // Function to render subtasks for a given task
  const renderSubtasks = (taskId: string) => {
    const subtaskItems = filteredData.filter(
      item => item.type === 'subtask' && item.parentId === taskId
    );
    
    if (subtaskItems.length === 0) {
      return <Empty description="No subtasks found" style={{ margin: '16px' }} />;
    }
    
    return (
      <div style={{ marginLeft: '32px', marginTop: '8px' }}>
        <Droppable droppableId={`droppable-subtask-${taskId}`}>
            {(provided: any) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {subtaskItems.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={!isEditing || item.isBlank}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          marginBottom: '8px',
                          ...provided.draggableProps.style
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: item.isBlank ? 0.5 : 1
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            {isEditing && !item.isBlank && (
                              <div 
                                {...provided.dragHandleProps}
                                style={{ marginRight: '8px', cursor: 'grab' }}
                              >
                                <DragOutlined />
                              </div>
                            )}
                            <Space>
                              <Typography.Text type="secondary">Subtask:</Typography.Text>
                              {!item.isBlank ? (
                                <>
                                  <Typography.Text strong>#{item.rank}</Typography.Text>
                                  <Typography.Text>{item.name}</Typography.Text>
                                  {item.description && (
                                    <Typography.Text type="secondary">({item.description})</Typography.Text>
                                  )}
                                </>
                              ) : (
                                <Typography.Text type="secondary" italic>
                                  No Subtask available
                                </Typography.Text>
                              )}
                            </Space>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
      </div>
    );
  };

  return (
    <Card 
      title="Task Rankings" 
      loading={loading}
      extra={
        canEditRanking && (
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSaveRanking}
            loading={loading}
          >
            Save Rankings
          </Button>
        )
      }
    >

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : filteredData.length === 0 ? (
        <Empty description="No tasks found" />
      ) : (
        <DragDropContext onDragEnd={handleUnifiedDragEnd}>{renderTaskSuperProjects()}</DragDropContext>
      )}
    </Card>
  );
};

export default ProjectRanking;