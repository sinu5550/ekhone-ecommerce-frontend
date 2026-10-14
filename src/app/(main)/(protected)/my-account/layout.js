import Container from "@/components/Shared/Container";
import Sidebar from "@/components/Shared/Sidebar/Sidebar";

export default function DashboardLayout({ children }) {
    return (
        <div 
            className="font-outfit"
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, rgba(244, 81, 22, 0.03) 0%, rgba(255, 255, 255, 0) 100%)'
            }}
        >
            <Container>
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 py-10">
                    {/* Sidebar - Mobile: full width, Desktop: 30% */}
                    <div className="w-full lg:w-[30%]">
                        <Sidebar />
                    </div>

                    {/* Main Content - Mobile: full width, Desktop: 70% */}
                    <div className="w-full lg:w-[70%] text-gray-800">
                        {children}
                    </div>
                </div>
            </Container>
        </div>
    );
}