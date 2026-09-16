import { UserMenu } from "@/components/Layout/UserMenu";
import { Card, Col, Menu, Row } from "antd";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ProfileProps {
    // Component may accept a userId prop (and others). Use a generic record to allow props.
    component: React.ComponentType<Record<string, any>>;
}


const Profile: React.FC<ProfileProps> = ({ component: Component }) => {
    const { id } = useParams();
    const isMobile = useIsMobile();

    return (
        <Card>
            <Row>
                <Col span={24}>
                    {/* Horizontal Menu for Profile Submenu */}
                    <Menu 
                        mode={isMobile ? "inline" : "horizontal"} 
                        className="mb-4"
                        style={{ 
                            borderBottom: '1px solid #f0f0f0',
                            marginBottom: '16px'
                        }}
                    >
                        {UserMenu(id)?.map((item) => (
                            <Menu.Item key={item.key}>
                                <Link to={item.key}>
                                    {item.icon}
                                    <span style={{ marginLeft: '8px' }}>{item.label}</span>
                                </Link>
                            </Menu.Item>
                        ))}
                    </Menu>
                </Col>
            </Row>
            <Row>
                <Col span={24} className="px-4">
                    {/* Render the passed component here, pass userId when available */}
                    {/* eslint-disable-next-line react/jsx-no-constructed-context-values */}
                    <Component {...(id ? { userId: id } : {})} />
                </Col>
            </Row>
        </Card>
    );
};

export default Profile;
