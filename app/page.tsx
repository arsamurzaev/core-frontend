import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerScrollArea,
  DrawerTitle,
} from "@/shared/ui/drawer";

export default function Home() {
  return (
    <div>
      <main>
        <Drawer defaultOpen={true}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Заголовок</DrawerTitle>
              <DrawerDescription>Описание</DrawerDescription>
            </DrawerHeader>
            <DrawerScrollArea></DrawerScrollArea>
            <DrawerFooter></DrawerFooter>
          </DrawerContent>
        </Drawer>
      </main>
      ;
    </div>
  );
}
