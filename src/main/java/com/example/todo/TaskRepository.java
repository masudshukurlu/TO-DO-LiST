package com.example.todo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectIdAndParentIsNull(Long projectId);

    long countByProjectIdAndParentIsNull(Long projectId);

    void deleteByParentId(Long parentId);

    void deleteByProjectId(Long projectId);
}
