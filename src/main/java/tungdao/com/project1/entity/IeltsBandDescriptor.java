package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "ielts_band_descriptors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IeltsBandDescriptor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "descriptor_id")
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SkillType skill;

    @Column(name = "task_type", length = 50)
    private String taskType;

    @Column(name = "band_score", nullable = false, precision = 3, scale = 1)
    private BigDecimal bandScore;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
}