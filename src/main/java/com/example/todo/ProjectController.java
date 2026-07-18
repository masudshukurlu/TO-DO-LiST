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
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public ProjectController(ProjectRepository projectRepository, TaskRepository taskRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public List<Project> list() {
        List<Project> projects = projectRepository.findAll();
        projects.forEach(p -> p.setTaskCount(taskRepository.countByProjectIdAndParentIsNull(p.getId())));
        return projects;
    }

    @PostMapping
    public Project create(@Valid @RequestBody Project project) {
        return projectRepository.save(project);
    }

    @PutMapping("/{id}")
    public Project update(@PathVariable Long id, @Valid @RequestBody Project body) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        project.setName(body.getName());
        return projectRepository.save(project);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!projectRepository.existsById(id)) {
            throw new NotFoundException("Project not found");
        }
        taskRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
