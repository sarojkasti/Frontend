import { Card, Avatar } from "antd"; // Import Avatar along with Card
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import Meta from "antd/es/card/Meta";
import PropTypes from 'prop-types';
import useIsMobile from '@/hooks/useIsMobile';

interface ProjectUser {
  id: string;
  avatar?: string;
  name: string;
  email: string;
}

interface UserCardProps {
  user: ProjectUser;
  isMobile?: boolean;
}

interface ProjectUserCardProps {
  data: ProjectUser[];
  onAddMember?: () => void;
}

// Component to render a single user card
const UserCard = ({ user, isMobile }: UserCardProps) => {
  if (isMobile) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm">
        <Avatar
          src={user.avatar}
          size={44}
          icon={<UserOutlined />}
          alt={`${user.name}'s avatar`}
          style={{ backgroundColor: '#1677ff' }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-800 text-sm truncate">{user.name}</div>
          <div className="text-xs text-gray-500 truncate">{user.email}</div>
        </div>
      </div>
    );
  }

  return (
    <Card
      hoverable
      className="project-user-card"
      cover={
        <div style={{ padding: '16px', background: '#f5f5f5', textAlign: 'center' }}>
          <Avatar
            src={user.avatar}
            size={100}
            alt={`${user.name}'s avatar`}
            icon={<UserOutlined />}
          />
        </div>
      }
      style={{ width: 240, margin: '16px' }}
    >
      <Meta title={user.name} description={user.email} />
    </Card>
  );
};

// Main component to render all user cards
const ProjectUserCard = ({ data, onAddMember }: ProjectUserCardProps) => {
  const { isMobile } = useIsMobile();

  return (
    <div className={isMobile ? "flex flex-col gap-2.5 w-full" : "flex flex-wrap justify-center"}>
      {data.map((user: ProjectUser) => (
        <UserCard key={user.id} user={user} isMobile={isMobile} />
      ))}
      {onAddMember && (
        isMobile ? (
          <button
            onClick={onAddMember}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl p-3 border border-dashed border-blue-300 flex items-center justify-center gap-2 font-medium text-sm transition-colors cursor-pointer w-full"
          >
            <PlusOutlined />
            <span>Add Member</span>
          </button>
        ) : (
          <Card
            hoverable
            className="project-user-card"
            onClick={onAddMember}
            style={{ width: 240, margin: '16px', cursor: 'pointer' }}
          >
            <div
              style={{
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1677ff'
              }}
            >
              <Avatar
                size={64}
                style={{ backgroundColor: '#e6f4ff', color: '#1677ff', marginBottom: 12 }}
                icon={<PlusOutlined />}
              />
              <div style={{ fontWeight: 600 }}>Add Member</div>
              <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>Assign a user to this project</div>
            </div>
          </Card>
        )
      )}
    </div>
  );
};

// PropTypes for type checking
UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
};

ProjectUserCard.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      avatar: PropTypes.string,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    })
  ).isRequired,
  onAddMember: PropTypes.func,
};

// Default props
ProjectUserCard.defaultProps = {
  data: [],
  onAddMember: undefined,
};

export default ProjectUserCard;