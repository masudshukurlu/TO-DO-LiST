package com.example.todo;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskController(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/projects/{projectId}/tasks")
    public List<Task> listByProject(@PathVariable Long projectId) {
        return taskRepository.findByProjectIdAndParentIsNull(projectId);
    }

    @PostMapping("/projects/{projectId}/tasks")
    public Task create(@PathVariable Long projectId, @Valid @RequestBody Task task) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        task.setProject(project);
        task.setParent(null);
        task.setCompleted(false);
        return taskRepository.save(task);
    }

    @PostMapping("/tasks/{parentId}/subtasks")
    public Task createSubtask(@PathVariable Long parentId, @Valid @RequestBody Task task) {
        Task parent = taskRepository.findById(parentId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
        task.setProject(parent.getProject());
        task.setParent(parent);
        task.setCompleted(false);
        return taskRepository.save(task);
    }

    @PutMapping("/tasks/{id}")
    public Task update(@PathVariable Long id, @Valid @RequestBody Task body) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found"));
        task.setTitle(body.getTitle());
        task.setDescription(body.getDescription());
        return taskRepository.save(task);
    }

    @PutMapping("/tasks/{id}/toggle")
    public Task toggle(@PathVariable Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found"));
        task.setCompleted(!task.isCompleted());
        return taskRepository.save(task);
    }

    @DeleteMapping("/tasks/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!taskRepository.existsById(id)) {
            throw new NotFoundException("Task not found");
        }
        taskRepository.deleteByParentId(id);
        taskRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
