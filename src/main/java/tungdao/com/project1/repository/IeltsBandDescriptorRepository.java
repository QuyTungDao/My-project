package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.IeltsBandDescriptor;
import tungdao.com.project1.entity.SkillType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface IeltsBandDescriptorRepository extends JpaRepository<IeltsBandDescriptor, Integer> {

    List<IeltsBandDescriptor> findBySkill(SkillType skill);

    List<IeltsBandDescriptor> findByTaskType(String taskType);

    List<IeltsBandDescriptor> findByBandScore(BigDecimal bandScore);

    Optional<IeltsBandDescriptor> findBySkillAndTaskTypeAndBandScore(SkillType skill, String taskType, BigDecimal bandScore);
}