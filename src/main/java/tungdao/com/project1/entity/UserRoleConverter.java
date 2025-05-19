package tungdao.com.project1.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter
public class UserRoleConverter implements AttributeConverter<UserRole, String> {

    private static final Logger logger = LoggerFactory.getLogger(UserRoleConverter.class);

    @Override
    public String convertToDatabaseColumn(UserRole userRole) {
        if (userRole == null) {
            return null;
        }
        return userRole.name();
    }

    @Override
    public UserRole convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }

        // Chuyển đổi về chữ hoa để đảm bảo khớp với enum
        String upperCaseValue = dbData.toUpperCase();

        try {
            return UserRole.valueOf(upperCaseValue);
        } catch (IllegalArgumentException e) {
            logger.error("Không thể chuyển đổi '{}' thành UserRole. Sử dụng giá trị mặc định STUDENT", dbData);
            return UserRole.STUDENT; // Giá trị mặc định
        }
    }
}